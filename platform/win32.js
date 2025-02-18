const childProcess = require('child_process')

const SayPlatformBase = require('./base.js')

const BASE_SPEED = 0 // Unsupported
const COMMAND = 'powershell'

class SayPlatformWin32 extends SayPlatformBase {
  constructor () {
    super()
    this.baseSpeed = BASE_SPEED
  }

  buildSpeakCommand ({ text, voice, speed }) {
    let args = []
    let pipedData = ''
    let options = {}

    let psCommand = `chcp 65001;` // Change powershell encoding to utf-8
    psCommand += `$speak = New-Object -ComObject SAPI.SpVoice;`

    if (voice) {
      psCommand += `$speak.Voice = $speak.GetVoices('Name="${voice}"').item(0);`;
    }

    if (speed) {
      let adjustedSpeed = this.convertSpeed(speed || 1)
      psCommand += `$speak.Rate = ${adjustedSpeed};`
    }

    psCommand += `$speak.Speak([Console]::In.ReadToEnd())`

    pipedData += text
    args.push(psCommand)
    options.shell = true

    return { command: COMMAND, args, pipedData, options }
  }

  buildExportCommand ({ text, voice, speed, filename }) {
    let args = []
    let pipedData = ''
    let options = {}

    let psCommand = `chcp 65001;` // Change powershell encoding to utf-8
    psCommand += `$speak = New-Object -ComObject SAPI.SpVoice;`

    if (voice) {
      psCommand += `$speak.Voice = $speak.GetVoices('Name="${voice}"').item(0);`
    }

    if (speed) {
      let adjustedSpeed = this.convertSpeed(speed || 1)
      psCommand += `$speak.Rate = ${adjustedSpeed};`
    }

    if (!filename) throw new Error('Filename must be provided in export();')
    else {
      psCommand += `$vs = New-Object -ComObject SAPI.SpFileStream;$vs.Open('"${filename}"',3);$speak.AudioOutputStream = $vs;`
    }

    psCommand += `$speak.Speak([Console]::In.ReadToEnd());$vs.Close();`

    pipedData += text
    args.push(psCommand)
    options.shell = true

    return { command: COMMAND, args, pipedData, options }
  }

  runStopCommand () {
    this.child.stdin.pause()
    childProcess.exec(`taskkill /pid ${this.child.pid} /T /F`)
  }

  convertSpeed (speed) {
    // Overriden to map playback speed (as a ratio) to Window's values (-10 to 10, zero meaning x1.0)
    return Math.max(-10, Math.min(Math.round((9.0686 * Math.log(speed)) - 0.1806), 10))
  }

  getVoices () {
    let args = []
    let psCommand = '$speak = New-Object -ComObject SAPI.SpVoice;$speak.GetVoices() | ForEach-Object {$_.GetAttribute("Name")}'
    args.push(psCommand)
    return { command: COMMAND, args }
  }
}

module.exports = SayPlatformWin32
