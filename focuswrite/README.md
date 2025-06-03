# SerenityWrite – Minimalist Writing App Template

This project provides a minimal React template for SerenityWrite—a clean, modern, and distraction-free writing experience.

## Features

- **Lightweight**: No heavy UI frameworks—uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with SerenityWrite brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Preview/Print Layout
SerenityWrite shifts into a "Print Layout" preview mode via the 🖨️ button in the interface. This clean preview renders your writing as it would appear exported/printed, hiding sidebars, controls, and switching to pure black-on-white typography. 

**To preview your writing:**  
- Use the "Print Layout" or "🖨️ Print" button in the top navigation bar.
- The writing area updates visually to show how the exported/printed text will appear.
- Click "Exit Print" or the same button to return to editing mode.

If you encounter problems (e.g., button does nothing, preview is broken, not all content appears, controls are not hidden), please check for errors in the browser console or verify you’re using a supported browser.

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.  
It correctly bundles React in production mode and optimizes the build for the best performance.

## Customization

### Soundscapes Setup

To use the Rain, Forest, and Waterfall soundscapes, you must provide the following .mp3 files in the `public/soundscapes/` directory of this project:

- `rain.mp3`
- `forest.mp3`
- `waterfall.mp3`

If these files are missing, a warning appears and sound playback will not work. Obtain or create your own calming ambient .mp3 files, then copy them to `public/soundscapes/`.

If you deploy to static hosting (Netlify, GitHub Pages etc), make sure the files are present and pushed.

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --kavia-orange: #E87A41;
  --kavia-dark: #1A1A1A;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

SerenityWrite uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
