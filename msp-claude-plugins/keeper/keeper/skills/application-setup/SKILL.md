---
name: "Keeper KSM Application Scoping"
description: >
  Building the Keeper Secrets Manager application that a Conduit
  connection authenticates as: what an application, a share and a client
  device are, how folder and record grants bound everything the
  connection can ever see, read-only vs editable shares, generating the
  base64 device configuration in the Vault UI or Keeper Commander,
  verifying the realised scope from the client side, and rotating or
  revoking a device.
when_to_use: >-
  When creating, scoping, auditing, rotating or revoking the Keeper
  credential behind a Conduit connection. Use when: keeper secrets manager
  application, ksm app, one-time access token, base64 configuration, add
  device, keeper least privilege, keeper client add, rotate keeper
  credential, or revoke keeper access.
---

# Scoping the KSM Application

## Overview

Everything the Keeper connection can ever reach is decided in Keeper,
before the connection exists. The bridge's read-only allowlist stops
writes; it does nothing about *breadth*. A KSM application granted the
company's entire "IT Passwords" shared folder gives a read-only
connection read access to every credential in it. Scope is the control
that matters, and it is set here.

## The model

| Object | What it is |
|--------|-----------|
| **Application** | A machine identity in a Keeper vault. Lives under the **Secrets Manager** tab, not in the folder tree |
| **Share** | A grant of a shared folder (or a record) to an application, marked read-only or editable |
| **Client device** | A credential issued *for* an application. An application can hold several; each is revocable on its own |
| **One-time access token** | The single-use string that a device redeems once to materialise its configuration |
| **Base64 configuration** | The redeemed device credential — a base64 JSON blob starting `ewog…` holding `clientId`, `privateKey`, `appKey` and `hostname`. This is what Conduit stores |

The application is the security boundary. The device is the rotation
unit.

## Setup, least privilege first

**1. Create the shared folder the automation will use — do not reuse an
existing one.** The grant is folder-shaped, so the folder is the smallest
unit you can hand over in the Vault UI. Populate it with only the records
Claude should reach. Sharing "IT Passwords" because the one needed record
lives there is the single most common scoping mistake.

**2. Create the application.** Vault → **Secrets Manager** tab →
**Create Application** → name it after the connection, not the vendor
(`conduit-keeper-prod`, not `keeper`) → choose the shared folder(s). The
documentation is explicit: *"The Application will only have access to the
records in the selected folder(s)."*

**3. Grant read-only.** The wizard offers **Read Only** or **Write**.
Choose Read Only. The bridge already refuses writes, so this looks
redundant — it is not. The grant lives in Keeper and is exercised by
*anything* holding that device configuration, including a copy of it
pasted into some other tool. Defence in depth means the credential
itself cannot write.

**4. Generate the device.** Still in the wizard, **Generate Access
Token**, or later via the application's **Devices** tab → **Add Device**.
Take the **base64 configuration** output — that is what Conduit's
`KSM Base64 Configuration` field wants. Name the device for the
connection it will serve.

**5. Decide the IP lock.** By default the first IP that redeems the token
is pinned. The redeeming client is the gateway container, not the
technician's workstation, and a hosted gateway's egress address is not
guaranteed stable. Pin only if you know that address and will maintain
it; otherwise create the device unlocked and rely on the scope and
rotation discipline instead.

**6. Paste into Conduit once, then discard your copy.** The base64 blob
*is* the credential. Do not store it in a ticket, a runbook, a password
note, or a repo.

### Commander equivalents

For MSPs scripting tenant onboarding, Keeper Commander does the same
thing without the UI:

```
secrets-manager app create conduit-keeper-prod
secrets-manager share add --app conduit-keeper-prod --secret <FOLDER_OR_RECORD_UID>
secrets-manager client add --app conduit-keeper-prod --name conduit-gateway --config-init b64
```

`share add` takes `--editable` to grant writes; omitting it is the
read-only default, and `share update --readonly` demotes an existing
grant. `--config-init b64` emits the base64 configuration directly, which
is the format Conduit needs. `client add --unlock-ip` creates the device
without the IP pin.

Commander's `share add --secret` accepts a record UID as well as a
folder, which is the tightest grant available — one record, one
connection. The Vault wizard has no equivalent.

## Verify the realised scope from the client side

Do not assume the grant matches the intent. Immediately after connecting,
ask the connection what it can actually see:

1. `list_folders` — every folder reachable. Anything unexpected here is a
   share you did not mean to make.
2. `list_secrets` — every record, metadata only. Compare the count
   against what you put in the folder.

Records added to a granted folder later are reachable without anyone
re-running a wizard, so re-run this check whenever the folder's contents
change and treat it as part of a quarterly access review rather than a
one-time task.

## Rotation and revocation

Rotate by **adding, swapping, then revoking** — never by deleting first:

1. `Add Device` on the application, take the new base64 configuration.
2. Re-submit the Conduit connection with the new value.
3. Confirm with `health_check`, then remove the old device
   (`secrets-manager client remove --app <app> --client <id>`).

To cut access entirely, revoke the device — or delete the application,
which revokes every device it issued at once. Un-sharing the folder
leaves the application and its devices alive but empty; that is the right
move when the credential is fine and only the data boundary changed.

Keeper does not track credential age for you. Nothing expires a redeemed
device configuration on its own.

## Gotchas

**The one-time token is single-use and shown once.** *"Once the token is
used on a target device, it cannot be used again"*, and the dialog does
not re-display it. Lose it before redeeming and you issue a new device;
there is no recovery step.

**Never grant the application the folder holding its own configuration.**
A connection able to read the credential that created it can be escalated
by anything that can read one record.

**A "read-only" Conduit connection is not a read-only Keeper grant.**
Those are two different controls in two different systems. If the share
was created editable, the credential can still write — just not through
this tool surface.

**Secrets Manager must be enabled on the Keeper plan and the role.** An
account without it has no Secrets Manager tab, and there is no workaround
from the client side.

**One application per connection, not one per MSP.** Shared applications
make revocation an all-or-nothing event and destroy the audit trail of
which integration read what.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — what the connection can do once the scope is set
- [finding-secrets](../finding-secrets/SKILL.md) — reading the realised scope with `list_folders` and `list_secrets`
