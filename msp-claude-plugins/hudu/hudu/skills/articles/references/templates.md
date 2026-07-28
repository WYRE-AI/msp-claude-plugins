# Hudu Article HTML Templates

## Network Overview

```html
<h1>Network Overview</h1>

<h2>Network Topology</h2>
<p>[Network diagram image here]</p>

<h2>IP Addressing</h2>
<table>
  <tr><th>Subnet</th><th>VLAN</th><th>Purpose</th></tr>
  <tr><td>192.168.1.0/24</td><td>1</td><td>Servers</td></tr>
  <tr><td>192.168.10.0/24</td><td>10</td><td>Workstations</td></tr>
  <tr><td>192.168.20.0/24</td><td>20</td><td>Guest WiFi</td></tr>
</table>

<h2>Core Infrastructure</h2>
<p>[Asset references here]</p>

<h2>Firewall Rules Summary</h2>
<p>[Rule overview]</p>

<h2>Related Credentials</h2>
<p>[Embedded passwords]</p>
```

## Disaster Recovery Plan

```html
<h1>Disaster Recovery Plan</h1>

<h2>Emergency Contacts</h2>
<table>
  <tr><th>Role</th><th>Name</th><th>Phone</th></tr>
  <tr><td>Primary Contact</td><td>John Smith</td><td>555-123-4567</td></tr>
  <tr><td>IT Manager</td><td>Jane Doe</td><td>555-987-6543</td></tr>
</table>

<h2>Critical Systems (Recovery Priority)</h2>
<ol>
  <li>Domain Controller - RTO: 1 hour</li>
  <li>Email Server - RTO: 2 hours</li>
  <li>File Server - RTO: 4 hours</li>
  <li>Line of Business App - RTO: 8 hours</li>
</ol>

<h2>Recovery Procedures</h2>
<h3>Complete Site Failure</h3>
<ol>
  <li>Activate backup site / cloud DR</li>
  <li>Restore domain controller from latest backup</li>
  <li>Verify DNS failover</li>
  <li>Restore email services</li>
  <li>Restore file server from backup</li>
</ol>

<h2>Required Credentials</h2>
<p>[Embedded password references]</p>

<h2>Vendor Support Contacts</h2>
<table>
  <tr><th>Vendor</th><th>Support Number</th><th>Account Number</th></tr>
  <tr><td>ISP</td><td>800-555-1234</td><td>ACCT-12345</td></tr>
  <tr><td>Backup Vendor</td><td>800-555-5678</td><td>ACCT-67890</td></tr>
</table>
```
