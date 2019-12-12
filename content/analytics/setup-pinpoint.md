---
title: "Setup Pinpoint"
date: 2019-12-11T16:46:30+01:00
draft: true
---

First of all, we need add pinpoint to our project. 

### Initializing Amazon Pinpoint via Amplify

**On the command line, in the photoalbums directory**:

1. **Run** `amplify add analytics`

1. **Press _Enter_**

1. **Define a resource name like _photoalbums_** 

1. **Let unauthenticated users send analytics events as well (as we let unauthenticated users browse our aölbums and look at our images)**

![amplify add analytics](/images/amplify_add_analytics.png)

{{% notice info %}}
-...
{{% /notice %}}

3. Wait for the provisioning to complete. This will take a few minutes.