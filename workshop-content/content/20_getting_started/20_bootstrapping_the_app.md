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

**In the Cloud9 terminal, run** `npx create-react-app photoalbums`.

**Then, navigate to the newly created directory with** `cd photoalbums`.


### Adding Semantic UI React

Before we start writing our UI, we'll also include Semantic UI components for React to give us components that will help make our interface look a bit nicer.

**In the photoalbums directory, run** `npm install --save semantic-ui-react`

Then, **edit public/index.html** and add this stylesheet link:

```html
<head>
    <!-- ... --> 

    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css"></link>

    <!-- ... --> 
</head>
```

### Starting the App
Now let's start our development server so we can make changes and see them refreshed live in the browser.

**In the photoalbums directory, run** `npm start`. 

Once the web server has started, click the **Preview** menu and **select Preview Running Application**

![preview running application](/images/preview_running_application.png)

If you'd like, you can also **pop the preview to a new window**:

![pop app to new window](/images/pop_browser_new_window.png)

Finally, **open another terminal window**. We'll leave this first terminal alone since it's running the web server process.

![new terminal](/images/c9_new_terminal.png)

### Simplifying markup

Next, we'll want to start with a clean slate.

➡️ **Replace `src/App.js` with** <span class="clipBtn clipboard" data-clipboard-target="#id6c0bff7c33c87c1117890501a772279cf876fb41photoalbumssrcAppjs"><strong>this content</strong></span> (click the gray button to copy to clipboard). 
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