<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Documentation](#documentation)
  - [Create a new react project from scratch](#create-a-new-react-project-from-scratch)
  - [Add typescript](#add-typescript)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Documentation

Resources:

- [Setup basic frontend project](https://www.freecodecamp.org/news/how-to-set-up-a-front-end-development-project/)
- [Add webpack](https://github.com/webcrumbs-community/webcrumbs/wiki/Resources:-Setting-up-a-basic-Webpack-project)

## Create a new react project from scratch

Add webpack (bundler) to project

```
npm init -y
```

**Result**:

- package.json created

```
{
  "name": "playground",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Mehraj",
  "license": "ISC"
}

```

Add react dependencies

```
npm install react react-dom
```

Adapt folder structure to react app

```
- playground
  - public
    - index.html
  - src
    - index.js
    - App.js
    - App.css
```

Adapt html to react

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
    <link rel="stylesheet" href="src/App.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

Adapt `index.js` to render the react app

```js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const app = document.getElementById('root');

const root = createRoot(app);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create App.js with the content

```js
import React from 'react';
import './App.css';

function App() {
  const updateTime = () => {
    const timeLabel = document.getElementById('timeLabel');
    const currentTime = new Date().toISOString();
    timeLabel.textContent = currentTime;
  };

  return (
    <div className="container">
      <label id="timeLabel">Current Time</label>
      <button onClick={updateTime}>Update Time</button>
    </div>
  );
}

export default App;
```

Add webpack
This is the bundler that bundles all our files into one big file. It also has loaders that can transpile tsx/jsx code to pure js. These are also required to load svg files, less, sass, jpg, etc.

```
npm install webpack webpack-cli --save-dev
```

Add Loaders:
Loaders are an essential part of Webpack in a React project as they are responsible for parsing the JSX files and compiling complex JSX files to browser-understandable Javascript files
Babel is a transpiler that transpiles jsx code to js.

```
npm install @babel/core @babel/preset-env @babel/preset-react babel-loader --save-dev
```

Install `style-loader` that is necessary to load css files

```
npm install style-loader css-loader --save-dev
```

Create webpack config `webpack.config.js`

```js
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

Create `.babelrc` file

```
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

Update NPM Script `package.json`

```
"scripts": {
    "start": "webpack --mode=development --watch",
    "build": "webpack --mode=production"
}
```

`npm run start` to run the app
Webpack rebuilds the files on changes and therefore it updates automatically. It is better to serve the react app on a server. There are webpack dev servers available just for that.

```
npm install webpack-dev-server --save-dev
```

Now can implement this script to run a dev server that serves the app.

```
"scripts": {
    "dev": "npx webpack-dev-server --open",
}
```

You might get this error in the console:

```
Refused to apply style from 'http://localhost:8080/src/App.css' because its MIME type ('text/html') is not a supported stylesheet MIME type, and strict MIME checking is enabled.
```

This indicates that the dev server is not configured to serve the css files. To fix this issue, you need to ensure that your server is configured to serve CSS files with the appropriate MIME type (text/css).

You could now adapt the webpack configuration or realize that the css styles are already bundled in the js.
So the stylesheet link in the html can be removed.

## Add typescript

install typescript and the loader

```
npm install typescript ts-loader --save-dev
```

Update webpack configuration

```js
const path = require('path');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Handle TypeScript files
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

Update the js file extentions of App.js to App.tsx and index.js to index.tsx. Furthermore, update the entry point in package.json.

Create `tsconfig.json` for ts configuration

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```
