---
title: "Tracking Events"
date: 2019-12-11T16:47:20+01:00
draft: true
weight: 120
---
Next we need to alter and add code in our **src/app.js** to generate trackable events from our application. 

Around line 10 we need to add **Analytics** to our import. The line should look like 

```javascript
import Amplify, { Analytics, API, Auth, graphqlOperation, Storage } from 'aws-amplify';
```

Then we need to add the event generation where we want to track our user interaction: 

```javascript
Analytics.record({ name: 'app-launch' });
```

The code should be placed within the render of the classes we want to track like below: 

```javascript
class AlbumsListLoader extends React.Component {
    onNewAlbum = (prevQuery, newData) => {
        // When we get data about a new album, we need to put in into an object 
        // with the same shape as the original query results, but with the new data added as well
        let updatedQuery = Object.assign({}, prevQuery);
        updatedQuery.listAlbums.items = prevQuery.listAlbums.items.concat([newData.onCreateAlbum]);
        return updatedQuery;
    }

    render() {
        Analytics.record({ name: 'app-launch' });
        return (
            <Connect 
                query={graphqlOperation(ListAlbums)}
                subscription={graphqlOperation(SubscribeToNewAlbums)} 
                onSubscriptionMsg={this.onNewAlbum}
            >
                {({ data, loading, errors }) => {
                    if (loading) { return <div>Loading...</div>; }
                    if (errors.length > 0) { return <div>{JSON.stringify(errors)}</div>; }
                    if (!data.listAlbums) return;

                return <AlbumsList albums={data.listAlbums.items} />;
                }}
            </Connect>
        );
    }
}
```

Browse to the Amazon Pinpoint Service in your Console to check the Events we're tracking

![pinpoint dashboard](/images/pinpoint_dashboard.png)

{{% notice info %}}
it takes **about 2-3 Minutes** until the first events will be shown at your Amazon Pinpoint Dashboard
{{% /notice %}}

By default Pinpoint also grabs some demographis of our users.

![pinpoint demographic](/images/pinpoint_demographics.png)


## Extend your business with Amazon Pinpoint

As you might noticed, Amazon Pinpoint offers much more than just to track your users in your application. 
So tinker around and try to generate value for your business using the analytics data! 
To get started you can use our [Amazon Pinpoint workshop ](https://www.pinpoint-workshop.com/)
