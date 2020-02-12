+++
title = "Searching Photos By Label"
chapter = false
weight = 40
+++

With all of the back-end work completed, now we just need to update our web app to allow searching for photos by label.

Let's create a new *Search* component and add it to the *App* component to be rendered on the root path. For rendering all of the matching photos in the *Search* component, we'll re-use the *PhotosList* component we already created.

**➡️ Replace `photoalbums/src/App.js` with** ___CLIPBOARD_BUTTON 1957013992344ecb1f1a16456fe6a062fce6bc73:photoalbums/src/App.js|

### What we changed

- Added a *Search* component that uses the *SearchPhotos* query to get a list of matching photos for a given label and renders the photos using the pre-existing *PhotosList* component.

- Added the *SearchPhotos* component to render as part of the root '/' path.

### Testing the photos search
With that done, you should be able to go back to the root path '/' in the web app and try out the search.

Note that when Amplify sets up the Amazon Elasticsearch Service integration, it will only index new data because it doesn't pass the existing data from DynamoDB at the time of creation. You'll need to upload a few more photos to an album before you'll see search results.

Give it a shot!

{{% notice note %}}
Before trying to search for a photo, please make sure that the `amplify push` from the previous page has finished. 
<br/><br/>
If you see an error like `Attempted import error: 'searchPhotos' is not exported from './graphql/queries' (imported as 'queries')` don't worry. It just means that the `amplify push` from the previous step isn't finished yet. When it finishes, it will re-generate the GraphQL queries file that `photoalbums/src/App.js` is looking for and this error will go away.
<br/>
<br/>
To test out the photo search, look in the Photos table in DynamoDB for some valid labels to use as search terms. You must enter a label that matches exactly with one that was detected by Rekognition.
{{% /notice %}}