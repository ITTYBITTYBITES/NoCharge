# NoCharge V2 — Windows quick start

This guide is for opening and trying the site locally without typing commands.

## 1. Download Node.js once

Download **Node.js 24.x LTS — Windows Installer (.msi) — x64** from the [official Node.js 24 downloads archive](https://nodejs.org/en/download/archive/v24). Choose **x64** for a typical Intel- or AMD-based Windows PC; choose **ARM64** only for a Windows-on-ARM computer. Avoid the source-code downloads and the `.zip` option. The MSI includes npm, which the project needs. Node 24 is an official LTS release line; see the [Node.js release schedule](https://nodejs.org/en/download/releases/).

During installation, keep the normal default options, including adding Node.js to `PATH`. When installation finishes, close any old terminal windows or sign out and back in if Windows cannot find Node.js.

## 2. Extract the workspace

Extract the downloaded workspace to a normal writable folder, such as `Documents\NoChargeV2`. Open the extracted folder and confirm that `Start-NoCharge.bat`, `package.json`, and `package-lock.json` are in the same folder.

## 3. Start the site

Double-click **`Start-NoCharge.bat`**. On its first run, it installs the project's packages automatically; this needs an internet connection and may take a minute. It then opens the site in your default browser at **http://localhost:5173/**.

A separate **NoCharge V2 - local server** window stays open while the site runs. Leave that window open; close it when you are finished. You do not need to type into it.

## Check the mobile layout

In Chrome or Edge, open DevTools with **F12**, turn on the device toolbar, choose **Responsive**, and set the width to **390** CSS pixels. The site can also be tested with a phone on the same Wi-Fi, but that requires using the PC's local network address and allowing the connection through Windows Firewall.

## If the launcher reports a problem

- **Node.js not found:** install the Node 24 LTS Windows MSI above, then close and reopen File Explorer or sign out and back in.
- **Port 5173 is in use:** close another local development server and double-click `Start-NoCharge.bat` again.
- **Package installation fails:** check that the PC is online, then try the launcher again. It reuses the downloaded packages on later starts.
- **The browser did not open:** use the URL printed in the NoCharge server window, normally `http://localhost:5173/`.

The launcher starts the website for manual testing. The separate automated Playwright test suite is optional and requires additional setup.
