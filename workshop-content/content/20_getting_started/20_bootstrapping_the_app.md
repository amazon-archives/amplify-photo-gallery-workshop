+++
title = "Bootstrapping the App"
chapter = false
weight = 20
+++

### Creating a React app
We'll get things started by building a new React web app using the **create-react-app** CLI tool. 

{{% notice info %}}
This will give us a sample React app with a local auto-reloading web server and some helpful transpiling support for the browser like letting us use async/await keywords, arrow functions, and more.
{{% /notice %}}

{{% notice tip %}}
You can learn more about create-react-app at [https://github.com/facebook/create-react-app](https://github.com/facebook/create-react-app).
{{% /notice %}}

**➡️ In the Cloud9 terminal, run** `npx create-react-app photoalbums`.

**➡️ Then, navigate to the newly created directory with** `cd photoalbums`.


### Adding Semantic UI React

Before we start writing our UI, we'll also include Semantic UI components for React to give us components that will help make our interface look a bit nicer.

**➡️ In the photoalbums directory, run** `npm install --save semantic-ui-react`

**➡️ Replace `public/index.html` with** <span class="clipBtn clipboard" data-clipboard-target="#id0ce4b3e780ae9cbb429b4d2a6ac625a057a5fed5photoalbumspublicindexhtml">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id0ce4b3e780ae9cbb429b4d2a6ac625a057a5fed5photoalbumspublicindexhtml"></div> <script type="text/template" data-diff-for="diff-id0ce4b3e780ae9cbb429b4d2a6ac625a057a5fed5photoalbumspublicindexhtml">commit 0ce4b3e780ae9cbb429b4d2a6ac625a057a5fed5
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Thu Feb 6 10:20:18 2020 +0800

    add semantic ui react

diff --git a/photoalbums/public/index.html b/photoalbums/public/index.html
index aa069f2..fa245c8 100644
--- a/photoalbums/public/index.html
+++ b/photoalbums/public/index.html
@@ -15,6 +15,8 @@
       user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
     -->
     <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
+    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css" />
+
     <!--
       Notice the use of %PUBLIC_URL% in the tags above.
       It will be replaced with the URL of the `public` folder during the build.
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id0ce4b3e780ae9cbb429b4d2a6ac625a057a5fed5photoalbumspublicindexhtml" style="position: relative; left: -1000px; width: 1px; height: 1px;"><!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css" />

    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the `public` folder during the build.
      Only files inside the `public` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running `npm run build`.
    -->
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
</html>

</textarea>
{{< /safehtml >}}

### Starting the App
Now let's start our development server so we can make changes and see them refreshed live in the browser.

**➡️ In the photoalbums directory, run** `npm start`. 

Once the web server has started, click the **Preview** menu and **select Preview Running Application**

![preview running application](/images/preview_running_application.png)

If you'd like, you can also **pop the preview to a new window**:

![pop app to new window](/images/pop_browser_new_window.png)

Finally, **open another terminal window**. We'll leave this first terminal alone since it's running the web server process.

![new terminal](/images/c9_new_terminal.png)

### Simplifying markup

Next, we'll want to start with a clean slate.

**➡️ Replace `src/App.js` with** <span class="clipBtn clipboard" data-clipboard-target="#id6c0bff7c33c87c1117890501a772279cf876fb41photoalbumssrcAppjs">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id6c0bff7c33c87c1117890501a772279cf876fb41photoalbumssrcAppjs"></div> <script type="text/template" data-diff-for="diff-id6c0bff7c33c87c1117890501a772279cf876fb41photoalbumssrcAppjs">commit 6c0bff7c33c87c1117890501a772279cf876fb41
Author: Gabe Hollombe <gabehol@amazon.com>
Date:   Tue Feb 11 13:53:16 2020 +0800

    hello world App.js

diff --git a/photoalbums/src/App.js b/photoalbums/src/App.js
index ce9cbd2..4b68c37 100644
--- a/photoalbums/src/App.js
+++ b/photoalbums/src/App.js
@@ -1,26 +1,13 @@
 import React from 'react';
-import logo from './logo.svg';
-import './App.css';
+
+import { Header } from 'semantic-ui-react';
 
 function App() {
   return (
-    <div className="App">
-      <header className="App-header">
-        <img src={logo} className="App-logo" alt="logo" />
-        <p>
-          Edit <code>src/App.js</code> and save to reload.
-        </p>
-        <a
-          className="App-link"
-          href="https://reactjs.org"
-          target="_blank"
-          rel="noopener noreferrer"
-        >
-          Learn React
-        </a>
-      </header>
-    </div>
-  );
+    <Header as="h1">
+      Hello World!
+    </Header>
+  )
 }
 
-export default App;
+export default App
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id6c0bff7c33c87c1117890501a772279cf876fb41photoalbumssrcAppjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">import React from 'react';

import { Header } from 'semantic-ui-react';

function App() {
  return (
    <Header as="h1">
      Hello World!
    </Header>
  )
}

export default App

</textarea>
{{< /safehtml >}}

{{% notice note %}}
At this point, the browser should automatically refresh and show a much simpler page, with just some text that says 'Hello World'. It's not much to look at yet, but it's good to start with as little markup as possible.
{{% /notice %}}