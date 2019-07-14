const MorphComponent = require('hui/morph')
const html = require('hui/html')
const css = require('csjs')

const styles = css`
  body {
    margin: 0;
  }
  .vhs-app-container {}
  .vhs-sidebar {}
  .vhs-viewer {}
`

class VHSContainer extends MorphComponent {
  createElement () {
    return html`
    <div class="${styles['vhs-app-container']}">
      <div class="${styles['vhs-sidebar']}">
        Sidebar
      </div>
      <div class="${styles['vhs-viewer']}">
        Viewer
      </div>
    </div>
    `
  }
}

document.body.appendChild(new VHSContainer().element)
