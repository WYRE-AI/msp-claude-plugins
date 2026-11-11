# Operator-owned RMM deployment

The operator uploads, runs, and schedules these scripts in the RMM console.
The Shadow AI skill only reads results; it never performs these actions.
Use [the scripts](../scripts/) and [output contract](output-contract.md).
Recommended field name: `ShadowAIInventory`; use a text field, with scripts
allowed to write and the connected API account allowed to read. Never use a
secure/password field. Pilot on one device per OS, inspect `st`, `tr`, and the
field timestamp, then schedule daily in the console. Use SYSTEM on Windows
(prefer 64-bit PowerShell 5.1 or 7) and root on macOS/Linux; grant macOS Full
Disk Access to the RMM agent where required. These are deployment recommendations,
not claims that every RMM has identical controls.

Windows selects `-Rmm`, `-Field`, `-Udf`, `-MaxLength`; shells select environment
variables `RMM`, `FIELD`, `MAX_LEN`. Default adapter is stdout, length 255.
Each OS file is standalone; do not upload the TSV or sync tool to endpoints.
Adapter helpers only send the generated inventory to the chosen field;
detection itself performs no network access. Printing stdout alone does
**not** populate a field unless the RMM documents a mapping step. Failed
adapters exit nonzero; retain the prior timestamp as stale rather than
assuming the field was refreshed. Do not embed endpoint-derived values in
commands, SQL, or procedure expressions.

## Datto RMM

Choose an unused UDF **1–30**, label it `ShadowAIInventory`, and record its
number for the reader. Avoid UDF 1 if isolation uses it. Retain the 255-character
cap even though current docs describe additional UDF slots.
Upload a component: Windows PowerShell, macOS/Linux shell; schedule a daily
job as SYSTEM/root. Windows example:

```powershell
.\Detect-ShadowAI.ps1 -Rmm datto -Udf 30
```

Windows writes only the documented `HKLM\SOFTWARE\CentraStage` string
`Custom30`. macOS/Linux adapters intentionally print stdout: Datto documents
an XML-file mechanism, but an atomic, preservation-safe implementation for
both OSes has **not been verified in this bundle**. There is no automatic
Unix UDF write or claimed stdout-to-UDF mapping. Results remain in job output
unless the operator supplies an independently reviewed vendor mechanism.
Read-back: `datto_get_device`, `udf.udf30` (operator-selected slot).
`datto_list_devices` passes Device records through and may already carry `udf`;
missing `udf` requires the detail read, not an assumption of no hits.
Sources: [UDF writing and limits](https://rmm.datto.com/help/en/Content/3NEWUI/Devices/UserDefinedFields.htm),
[component languages](https://rmm.datto.com/help/en/Content/3NEWUI/Automation/Components/Scripting.htm).

## NinjaOne

Create a device text/multiline custom field with internal name
`ShadowAIInventory`, Scripts write permission and API read permission. Add
the appropriate OS script under Administration > Library > Automation;
schedule daily as SYSTEM/root. All three OSes are documented.
Windows uses `-Rmm ninjaone` and `Ninja-Property-Set`. macOS/Linux use
`RMM=ninjaone` and the agent's fixed `ninjarmm-cli` path; values are passed as
one quoted argument. A larger `MAX_LEN` requires a suitably sized field.
Read-back: `ninjaone_devices_get_custom_fields`, example `{"device_id":123}`;
select the configured internal field, never the update tool.
Sources: [field permissions and upload](https://www.ninjaone.com/docs/custom-fields/custom-fields-scripting-read-writes/),
[Windows helper and Unix paths](https://www.ninjaone.com/docs/endpoint-management/custom-fields/advanced-custom-fields/).

## N-able N-central

Create a device Text custom property `ShadowAIInventory`, applying it to
required device classes. Windows: upload/wrap the PowerShell stdout in an
Automation Manager policy (AMP), expose a string output, then map that
output to the property in a Scheduled Task Profile; schedule daily as SYSTEM.
`-Rmm ncentral` only prints the record: it does not create an AMP output itself.
macOS/Linux: upload the shell script in the modern Script Repository,
choose Bash/Shell and root. Current scripting docs cover both OSes; older
macOS Task Execution explicitly excludes AMP. Direct shell-stdout-to-property
mapping on those OSes is **not verified**; retain task output unless separately
verified. Read-back of a populated property:
`ncentral_list_device_custom_properties` with `{"deviceId":123}`, then
`ncentral_get_device_custom_property` with `{"deviceId":123,"propertyId":456}`.
Sources: [AMP output mapping](https://documentation.n-able.com/N-central/userguide/Content/Administration/Custom_Device_Properties/CustomProperties_walkthrough-automation.htm),
[modern OS/language support](https://documentation.n-able.com/N-central/userguide/Content/Views/scriptrepo-script-configs.htm),
[macOS AMP limitation](https://documentation.n-able.com/N-central/userguide/Content/ScriptSoftwareRepository/ScriptRep_Task_Execution.htm).

## ConnectWise Automate

Reserve a computer text EDF `ShadowAIInventory`. The intended operator
workflow is a daily SYSTEM/root script whose captured output is stored in
that EDF. `cwautomate` is stdout-only. The public vendor evaluation guide
confirms scripts, EDFs, and Windows/Mac/Linux agents; precise current upload,
output-variable, and EDF-setting function steps could **not be verified**
from accessible vendor documentation. Do not treat a guessed EDF function
or SQL recipe as setup instructions. Have the operator verify these steps
against their licensed Automate help before field mapping; otherwise keep
script-console output. Use the PowerShell file on Windows and shell files
on supported macOS/Linux agents, subject to that version's script runner.
Read-back gap: `cwautomate_computers_get` exposes no EDF values in its Computer
type. Report **endpoint script results not readable through connected MCP tools**;
console/export evidence remains useful to the operator.
Source: [vendor evaluation guide](https://www.connectwise.com/globalassets/media/documents/connectwiseautomateevaluationguide.pdf).

## Atera

Create an Agent script-based custom field named `ShadowAIInventory`, output
type Text, with separate OS-appropriate PowerShell/macOS Shell scripts.
Use `atera` or default stdout. Scripts require no RMM variables for this
mode; the field captures stdout. Atera documents automatic refresh every
12 hours or on Agent Console access, rather than our recommended daily
cadence. Script-based fields require the documented plan/admin access.
Linux Bash scripting exists: upload the Linux script through its Bash
runner and optionally schedule a daily IT automation profile as root;
Linux script-based **field mapping is not verified** (the field docs list
Windows/Mac). Use console output there. Windows runs as SYSTEM; macOS as root.
Read-back gap: `atera_agents_get` has no custom-value reader. Report
**endpoint script results not readable through connected MCP tools**.
Sources: [script-based fields](https://support.atera.com/hc/en-us/articles/215952967-Custom-fields),
[Mac/Linux Bash](https://support.atera.com/hc/en-us/articles/115005674387-Support-for-Bash-script-files-Mac-Linux),
[scheduling profiles](https://support.atera.com/hc/en-us/articles/360001801568-Automate-patch-management-via-IT-automation-profiles).

## Syncro

Create a text Asset Custom Field `ShadowAIInventory`. Add the OS script to
the Scripts library and schedule daily as SYSTEM/root. Windows selects
`-Rmm syncro`; it imports the agent-provided Syncro module and calls
`Set-Asset-Field -Name ... -Value ...`. macOS selects `RMM=syncro` and uses
`syncro set-asset-field` with quoted name/value arguments. Linux scripting
is now documented: choose **Bash**, load the RMM's Script module using its
runner's supplied initialization, and select `RMM=syncro`; the adapter calls
the documented `Set-Asset-Field` function. Do not invent a module path.
Read-back: `syncro_assets_get`, example `{"asset_id":123}`; returns the raw
asset including `properties`. Read the configured field key; a missing key
is incomplete inventory. The API schema calls these asset custom fields.
Sources: [Windows/macOS field helpers](https://docs.syncrosecure.com/scripts-reference),
[Linux Bash and field function](https://docs.syncrosecure.com/agents-alerts-automations/work-with-the-syncro-linux-agent),
[official asset API schema](https://api-docs.syncromsp.com/swagger.json).

## SuperOps

Create a text/long-text custom field `ShadowAIInventory` in the RMM Monitoring
class. Add the script under Modules > Scripts, choose Windows PowerShell
or macOS/Linux **Bash**, root/SYSTEM, and schedule daily through policy.
Windows selects `-Rmm superops`; the adapter imports the supplied
`SuperOpsModule` if needed, then calls `Send-CustomField` with named arguments.
Shell adapters select `RMM=superops`, source the RMM-provided `SuperOpsModule`,
and call `Send-CustomField` with two quoted arguments. The Linux file is
POSIX sh for scanning; invoke it with **Bash** for this vendor module.
Read-back: `superops_assets_get`, example `{"assetId":"123"}`, selects
`customFields` as a JSON scalar. Match the configured field within the
returned JSON; do not use custom query/mutation passthroughs.
Sources: [script creation, OSes, scheduling, module and field function](https://support.superops.com/en/articles/7054997-using-scripts-in-superops),
[field creation](https://support.superops.com/en/articles/6632048-setting-up-custom-fields-for-monitored-assets).

## Kaseya VSA

For **VSA 9**, create a text machine custom/System Info field
`ShadowAIInventory`. The operator builds an Agent Procedure, uploads the
appropriate OS file in File Manager, captures its stdout in a procedure
variable, then uses `updateSystemInfo()` to store that variable; schedule
daily as SYSTEM/root. `kaseyavsa` only prints. Windows/Linux/OS X procedure
support is documented, but the exact capture-to-custom-field behavior for
macOS/Linux and equivalence in VSA 10 are **not verified**. Use console output
on versions/OSes where this cannot be confirmed. Do not interpolate untrusted
endpoint text into procedure expressions. Only the fixed-format result belongs
in the field.
Read-back gap: `kaseya_vsa_get_agent` returns agent asset data without custom
fields; there is no exposed custom-field reader. Report **endpoint script
results not readable through connected MCP tools**.
Sources: [procedure editor/upload](https://help.vsa9.kaseya.com/help/Content/VSA/4785.htm),
[variable capture commands](https://help.vsa9.kaseya.com/help/Content/VSA/674.htm),
[System Info writing](https://help.vsa9.kaseya.com/help/Content/VSA/5346.htm),
[procedure OS support](https://help.kaseya.com/webhelp/EN/VSA/9000000/EN_agentprocedures_R9.pdf).

## Verification boundary

Mechanisms above were checked against public vendor docs; no live RMM was
available. Read-back was verified in the supplied MCP/client source and
Conduit `origin/main` classification; see [source verification](source-verification.md).
No MCP tool deploys or writes fields in this workflow. If mapping is not
verified or a field is missing, report the limitation rather than a clean scan.
