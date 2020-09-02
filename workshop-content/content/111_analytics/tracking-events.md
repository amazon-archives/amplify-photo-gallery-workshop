---
title: "Tracking Events"
date: 2019-12-11T16:47:20+01:00
draft: false
weight: 120
---
Next we need to alter and add code in our **src/app.js** to generate trackable events from our application. 

Around line 10 we need to add **Analytics** to our import. The line should look like 

```javascript
import Amplify, { Analytics, API, Auth, graphqlOperation, Storage } from 'aws-amplify';
```

Then we need to add the event generation where we want to track our user interaction. 
Amplify simplifies that; all we need to do is to add the following code to **src/app.js**:  

```javascript
Analytics.autoTrack('session', {
    enable: true,
    provider: 'AWSPinpoint'
});

Analytics.autoTrack('pageView', {
    enable: true,
    eventName: 'pageView',
    type: 'SPA',
    provider: 'AWSPinpoint',
    getUrl: () => {
        return window.location.origin + window.location.pathname;
    }
});
```

This will do everything automatically for you. If you want to, you can further customize when and what to track. There are several options to target this use-case. Try it out and tinker! The official [Amplify documentation](https://aws-amplify.github.io/docs/js/analytics) is a good starting point to get into it

Browse to the Amazon Pinpoint Service in your Console to check the Events we're tracking

![pinpoint dashboard](/images/pinpoint_dashboard.png)

{{% notice info %}}
it takes **about 2-3 Minutes** until the first events will be shown at your Amazon Pinpoint Dashboard
{{% /notice %}}

By default Pinpoint also grabs some demographics of our users.

![pinpoint demographic](/images/pinpoint_demographics.png)
