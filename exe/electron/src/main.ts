import { app, BrowserWindow, shell, protocol, net } from "electron"
import path from "path"
import { pathToFileURL } from "url"

protocol.registerSchemesAsPrivileged([{
  scheme: "app",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "GesStock",
    icon: path.join(app.getAppPath(), "assets", "logo.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#F8F9FA",
  })

  win.setMenuBarVisibility(false)

  win.webContents.session.setPermissionRequestHandler((_wc, _permission, cb) => cb(false))

  const frontendRoot = path.join(app.getAppPath(), "frontend-dist")
  protocol.handle("app", (request) => {
    const url = new URL(request.url)
    const relative = url.pathname.replace(/^\//, '') || 'index.html'
    const filePath = path.join(frontendRoot, relative)
    return net.fetch(pathToFileURL(filePath).href).catch(() =>
      net.fetch(pathToFileURL(path.join(frontendRoot, "index.html")).href)
    )
  })

  win.loadURL("app://gesstock/index.html")

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
}

app.whenReady().then(createWindow)
app.on("window-all-closed", () => app.quit())
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
