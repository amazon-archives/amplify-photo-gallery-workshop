+++
title = "Rendering the Front End"
chapter = false
weight = 20
+++

Now that we have our backend set up for managing registrations and sign-in, all we need to do is use the _withAuthenticator_ [higher-order React component from AWS Amplify](https://aws-amplify.github.io/amplify-js/media/authentication_guide.html#using-components-in-react) to wrap our existing _App_ component. This will take care of rendering a simple UI for letting users sign up, confirm their account, sign in, sign out, or reset their password.

### Adding Amplify NPM dependencies

We haven't yet added the *aws-amplify* and *aws-amplify-react* modules to our app, so let's add them.

**➡️ Run** `npm install --save aws-amplify@3.0.7 aws-amplify-react@3.1.9`

**➡️ Replace `src/App.js` with** <span class="clipBtn clipboard" data-clipboard-target="#iddaa4069beb70d721535869f7078c9ad1c27b03c0photoalbumssrcAppjs">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-iddaa4069beb70d721535869f7078c9ad1c27b03c0photoalbumssrcAppjs"></div> <script type="text/template" data-diff-for="diff-iddaa4069beb70d721535869f7078c9ad1c27b03c0photoalbumssrcAppjs">commit daa4069beb70d721535869f7078c9ad1c27b03c0
Author: Gabe Hollombe <gabehol@amazon.com>
Date:   Tue Feb 11 13:53:51 2020 +0800

    integrate auth to frontend

diff --git a/photoalbums/src/App.js b/photoalbums/src/App.js
index 4b68c37..8cbceb0 100644
--- a/photoalbums/src/App.js
+++ b/photoalbums/src/App.js
@@ -1,13 +1,24 @@
 import React from 'react';
 
+import Amplify from 'aws-amplify';
+import aws_exports from './aws-exports';
+
+import { withAuthenticator } from 'aws-amplify-react';
 import { Header } from 'semantic-ui-react';
 
+Amplify.configure(aws_exports);
+
 function App() {
   return (
     <Header as="h1">
       Hello World!
     </Header>
-  )
+  );
 }
 
-export default App
+export default withAuthenticator(App, {
+  includeGreetings: true,
+  signUpConfig: {
+    hiddenDefaults: ['phone_number']
+  }
+});
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="iddaa4069beb70d721535869f7078c9ad1c27b03c0photoalbumssrcAppjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">import React from 'react';

import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';

import { withAuthenticator } from 'aws-amplify-react';
import { Header } from 'semantic-ui-react';

Amplify.configure(aws_exports);

function App() {
  return (
    <Header as="h1">
      Hello World!
    </Header>
  );
}

export default withAuthenticator(App, {
  includeGreetings: true,
  signUpConfig: {
    hiddenDefaults: ['phone_number']
  }
});

</textarea>
{{< /safehtml >}}

Take a look at the web app now and you should have a sign-up / sign-in form!

### What we changed in App.js

- Imported and configured the AWS Amplify JS library

- Imported the withAuthenticator higher order component from aws-amplify-react

- Wrapped the App component using withAuthenticator

### Creating an account

**➡️ Create an account in the app's web interface** by providing a username, password, and a **valid email address** (to receive a confirmation code at).

{{% notice info %}}
You'll be taken to a screen asking you to confirm a code. This is because Amazon Cognito wants to verify a user's email address before it lets them sign in. 
{{% /notice %}}

**➡️ Check your email**. You should have received a confirmation code message. **Copy and paste the confirmation code** into your app and you should then be able to log in with the username and password you entered during sign up. 

Once you sign in, the form disappears and you can see our App component rendered below a header bar that contains your username and a 'Sign Out' button.

{{% notice tip %}}
This is a pretty simple authentication UI, but there's a lot you can do to customize it, including replacing parts with your own React components or using a completely hosted UI that can redirect back to your app. See the Customization section of the [AWS Amplify Authentication Guide](https://aws.github.io/aws-amplify/media/authentication_guide#customization) for more information.
{{% /notice %}}