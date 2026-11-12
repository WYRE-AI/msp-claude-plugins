#!/usr/bin/env python3
"""Offline, strict SAI1 reader. Never executes endpoint scripts or RMM tools."""
import argparse
import csv
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import re
import sys

GRAMMAR = re.compile(r'SAI1;v=([0-9]+\.[0-9]+\.[0-9]+);ts=([0-9]{8}T[0-9]{6}Z);os=(win|mac|lin);st=(ok|partial|error);n=(0|[1-9][0-9]*);f=([a-z][a-z0-9]*\.[mu](?:,[a-z][a-z0-9]*\.[mu])*)?;tr=(0|[1-9][0-9]*)')


def parse_result(value, max_age_days=7, now=None):
    if not 0 < max_age_days <= 3650:
        raise ValueError('Invalid freshness window')
    if len(value) > 65535 or not value.isascii():
        raise ValueError('Invalid record length/encoding')
    match = GRAMMAR.fullmatch(value)
    if not match:
        raise ValueError('Malformed SAI1 record')
    version, stamp, os_name, status, count, ids, omitted = match.groups()
    timestamp = datetime.strptime(stamp, '%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc)
    tokens = ids.split(',') if ids else []
    if len(tokens) != len(set(tokens)) or int(count) != len(tokens) + int(omitted):
        raise ValueError('Duplicate tokens or inconsistent count')
    with (Path(__file__).parent/'signatures.tsv').open() as stream:
        signatures = list(csv.DictReader(stream, delimiter='\t'))
    observations = []
    for token in tokens:
        sig_id, scope = token.split('.')
        rows = [r for r in signatures if r['id']==sig_id and r['os']==os_name and r['scope']==scope]
        if not rows:
            raise ValueError('Unknown signature ID/OS/scope')
        observations.append({'id':sig_id,'scope':scope,'product':rows[0]['product'],
                             # Compact records cannot tell which signature fired: use weakest confidence.
                             'confidence':'review' if any(r['confidence']=='review' for r in rows) else 'high'})
    now = now or datetime.now(timezone.utc)
    reasons = []
    if version != '1.0.0': reasons.append('unsupported script version')
    if timestamp < now-timedelta(days=max_age_days): reasons.append('stale')
    if timestamp > now+timedelta(minutes=5): reasons.append('future timestamp')
    if status != 'ok': reasons.append(status)
    if int(omitted): reasons.append('truncated')
    return {'version':version,'timestamp':stamp,'os':os_name,'status':status,'count':int(count),
            'omitted':int(omitted),'observations':observations,'incomplete':bool(reasons),'reasons':reasons}

if __name__=='__main__':
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--max-age-days',type=float,default=7)
    args=cli.parse_args()
    value=sys.stdin.read(65537)
    if value.endswith('\n'): value=value[:-1]  # single transport newline only
    try: print(json.dumps(parse_result(value,args.max_age_days),separators=(',',':')))
    except (ValueError, OverflowError):
        print('{"incomplete":true,"error":"malformed result"}')
        sys.exit(2)
