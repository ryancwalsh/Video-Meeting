# Video Meeting

Developed with ReactJS, Node.js, SocketIO.

![Website](https://i.imgur.com/HhZD01o.jpg)

### Demo
Try Video Meeting here [video.sebastienbiollo.com](https://video.sebastienbiollo.com)


### Features
- Is 100% free and open-source
- No account needed
- Unlimited users
- Messaging chat and video streaming in real-time
- Screen sharing to present documents, slides, and more
- Everything is peer-to-peer thanks to WebRTC


### Local setup

1. `yarn install`
2. `yarn dev`


### TODO

1. Test spatial audio with different numbers of participants and layouts
1. Honor the mute button's state!!
1. Host HighFidelityAudio JS file locally (so as to pin the version), ideally via import in node_modules.
1. Move to RedwoodPlus
    1. Set up Prettier and Eslint
    1. Make deployable on Netlify
    1. Split Video.js into smaller files
1. Use cookie to save username / session
1. Disable video by default (but allow optional preview before starting call)
1. Improve styles
1. Convert to TypeScript