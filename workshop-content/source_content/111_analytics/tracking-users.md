---
title: "Tracking Users"
date: 2019-12-11T16:47:20+01:00
draft: false
weight: 130
---

One advantage of Amazon Pinpoint is it simplifies customer engagements. So let's extend our Pinpoint setup to be able to run such campaigns. 

First of all we need to enable email sending for our Pinpoint Service.

1. Browse to the Amazon Pinpoint service console

1. Go to **Settings -> Email** 

1. Select **Edit** at the Identities tab on the bottom

1. Select **Enable the email channel for this project**

1. Type in your **Email address** for verification

1. Click on **save**

You'll receive an email with your verification link. after verifying your address you're ready to use Pinpoints Email sending function. 


Next we need to extend our code to track our Users and collect data to generate campaigns or other fancy stuff. 

edit **src/App.js** once again and add something like: 

```javascript
const mappedobjects = f => obj =>
  Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: f(obj[key]) }), {});
const Arrayofourstrings = value => [`${value}`];
const mapArrayofourstrings = mappedobjects(Arrayofourstrings);

async function trackUserIdforPinpoint() {
    const { attributes } = await Auth.currentAuthenticatedUser();
    const userAttributes = mapArrayofourstrings(attributes);
    Analytics.updateEndpoint({
      address: attributes.email,      
      channelType: 'EMAIL',      
      optOut: 'NONE',      
      userId: attributes.sub,      
      userAttributes,    
    });
  } 

trackUserIdforPinpoint();
```

Wait a few minutes and you should be able to see "Active targetable endpoints" in your Campaign Dashboard section:

![pinpoint demographic](/images/pinpoint_endpoints.png)

## Extend your business with Amazon Pinpoint

As you might have noticed, Amazon Pinpoint offers much more than just user activity tracking in your application. 
Tinker around and try to generate value for your business using the analytics data! 
To get started you can use our [Amazon Pinpoint workshop](https://www.pinpoint-workshop.com/)
