+++
title = "Searching Photos By Label"
chapter = false
weight = 40
+++

With all of the back-end work completed, now we just need to update our web app to allow searching for photos by label.

Let's create a new *Search* component and add it to the *App* component to be rendered on the root path. For rendering all of the matching photos in the *Search* component, we'll re-use the *PhotosList* component we already created.

**➡️ Replace `photoalbums/src/App.js` with** <span class="clipBtn clipboard" data-clipboard-target="#id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumssrcAppjs">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumssrcAppjs"></div> <script type="text/template" data-diff-for="diff-id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumssrcAppjs">commit 1957013992344ecb1f1a16456fe6a062fce6bc73
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Fri Feb 7 18:28:08 2020 +0800

    update graphql schema for search and frontend

diff --git a/photoalbums/src/App.js b/photoalbums/src/App.js
index e93bdb9..9806b55 100644
--- a/photoalbums/src/App.js
+++ b/photoalbums/src/App.js
@@ -267,6 +267,49 @@ const PhotosList = React.memo((props) => {
 })
 
 
+const Search = () => {
+  const [photos, setPhotos] = useState([])
+  const [label, setLabel] = useState('')
+  const [hasResults, setHasResults] = useState(false)
+  const [searched, setSearched] = useState(false)
+
+  const getPhotosForLabel = async (e) => {
+      setPhotos([])
+      const result = await API.graphql(graphqlOperation(queries.searchPhotos, { filter: { labels: { match: label }} }));
+      if (result.data.searchPhotos.items.length !== 0) {
+          setHasResults(result.data.searchPhotos.items.length > 0)
+          setPhotos(p => p.concat(result.data.searchPhotos.items))
+      }
+      setSearched(true)
+  }
+
+  const NoResults = () => {
+    return !searched
+      ? ''
+      : <Header as='h4' color='grey'>No photos found matching '{label}'</Header>
+  }
+
+  return (
+      <Segment>
+        <Input
+          type='text'
+          placeholder='Search for photos'
+          icon='search'
+          iconPosition='left'
+          action={{ content: 'Search', onClick: getPhotosForLabel }}
+          name='label'
+          value={label}
+          onChange={(e) => { setLabel(e.target.value); setSearched(false);} }
+        />
+        {
+            hasResults
+            ? <PhotosList photos={photos} />
+            : <NoResults />
+        }
+      </Segment>
+  );
+}
+
 function App() {
   return (
     <Router>
@@ -274,6 +317,7 @@ function App() {
         <Grid.Column>
           <Route path="/" exact component={NewAlbum}/>
           <Route path="/" exact component={AlbumsList}/>
+          <Route path="/" exact component={Search}/>
 
           <Route
             path="/albums/:albumId"
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="id1957013992344ecb1f1a16456fe6a062fce6bc73photoalbumssrcAppjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">import React, {useState, useEffect} from 'react';

import Amplify, {Auth} from 'aws-amplify'
import API, {graphqlOperation} from '@aws-amplify/api'
import Storage from '@aws-amplify/storage'
import aws_exports from './aws-exports'

import {S3Image, withAuthenticator} from 'aws-amplify-react'
import {Divider, Form, Grid, Header, Input, List, Segment} from 'semantic-ui-react'

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';

import {v4 as uuid} from 'uuid';

import * as queries from './graphql/queries'
import * as mutations from './graphql/mutations'
import * as subscriptions from './graphql/subscriptions'

Amplify.configure(aws_exports);

function makeComparator(key, order = 'asc') {
  return (a, b) => {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) 
      return 0;
    
    const aVal = (typeof a[key] === 'string')
      ? a[key].toUpperCase()
      : a[key];
    const bVal = (typeof b[key] === 'string')
      ? b[key].toUpperCase()
      : b[key];

    let comparison = 0;
    if (aVal > bVal) 
      comparison = 1;
    if (aVal < bVal) 
      comparison = -1;
    
    return order === 'desc'
      ? (comparison * -1)
      : comparison
  };
}

const NewAlbum = () => {
  const [name,
    setName] = useState('')

  const handleSubmit = async(event) => {
    event.preventDefault();
    await API.graphql(graphqlOperation(mutations.createAlbum, {input: {
        name
      }}))
    setName('')
  }

  return (
    <Segment>
      <Header as='h3'>Add a new album</Header>
      <Input
        type='text'
        placeholder='New Album Name'
        icon='plus'
        iconPosition='left'
        action={{
        content: 'Create',
        onClick: handleSubmit
      }}
        name='name'
        value={name}
        onChange={(e) => setName(e.target.value)}/>
    </Segment>
  )
}

const AlbumsList = () => {
  const [albums,
    setAlbums] = useState([])

  useEffect(() => {
    async function fetchData() {
      const result = await API.graphql(graphqlOperation(queries.listAlbums, {limit: 999}))
      setAlbums(result.data.listAlbums.items)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let subscription
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser()
      subscription = API.graphql(graphqlOperation(subscriptions.onCreateAlbum, {owner: user.username})).subscribe({
        next: (data) => {
          const album = data.value.data.onCreateAlbum
          setAlbums(a => a.concat([album].sort(makeComparator('name'))))
        }
      })
    }
    setupSubscription()

    return () => subscription.unsubscribe();
  }, [])

  const albumItems = () => {
    return albums
      .sort(makeComparator('name'))
      .map(album => <List.Item key={album.id}>
        <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
      </List.Item>);
  }

  return (
    <Segment>
      <Header as='h3'>My Albums</Header>
      <List divided relaxed>
        {albumItems()}
      </List>
    </Segment>
  );
}

const AlbumDetails = (props) => {
  const [album, setAlbum] = useState({name: 'Loading...', photos: []})
  const [photos, setPhotos] = useState([])
  const [hasMorePhotos, setHasMorePhotos] = useState(true)
  const [fetchingPhotos, setFetchingPhotos] = useState(false)
  const [nextPhotosToken, setNextPhotosToken] = useState(null)

  useEffect(() => {
    const loadAlbumInfo = async() => {
      const results = await API.graphql(graphqlOperation(queries.getAlbum, {id: props.id}))
      setAlbum(results.data.getAlbum)
    }

    loadAlbumInfo()
  }, [props.id])

  useEffect(() => {
    fetchNextPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let subscription
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser()
      subscription = API.graphql(graphqlOperation(subscriptions.onCreatePhoto, {owner: user.username})).subscribe({
        next: (data) => {
          const photo = data.value.data.onCreatePhoto
          if (photo.albumId !== props.id) return
            setPhotos(p => p.concat([photo]))
        }
      })
    }
    setupSubscription()

    return () => subscription.unsubscribe();
  }, [props.id])


  const fetchNextPhotos = async () => {
    const FETCH_LIMIT = 20
    setFetchingPhotos(true)
    let queryArgs = {
      albumId: props.id,
      limit: FETCH_LIMIT, 
      nextToken: nextPhotosToken
    }
    if (! queryArgs.nextToken) delete queryArgs.nextToken
    const results = await API.graphql(graphqlOperation(queries.listPhotosByAlbum, queryArgs))
    setPhotos(p => p.concat(results.data.listPhotosByAlbum.items))
    setNextPhotosToken(results.data.listPhotosByAlbum.nextToken)
    setHasMorePhotos(results.data.listPhotosByAlbum.items.length === FETCH_LIMIT)
    setFetchingPhotos(false)
  }

  return (
    <Segment>
      <Header as='h3'>{album.name}</Header>
      <S3ImageUpload albumId={album.id} />
      <PhotosList photos={photos} />
      {
          hasMorePhotos && 
          <Form.Button
            onClick={() => fetchNextPhotos()}
            icon='refresh'
            disabled={fetchingPhotos}
            content={fetchingPhotos ? 'Loading...' : 'Load more photos'}
          />
      }
    </Segment>
  )
}


const S3ImageUpload = (props) => {
  const [uploading, setUploading] = useState(false)
  
  const uploadFile = async (file) => {
    const fileName = 'upload/'+uuid();
    const user = await Auth.currentAuthenticatedUser();

    const result = await Storage.vault.put(
      fileName, 
      file, 
      {
        metadata: { 
          albumid: props.albumId, 
          owner: user.username,
        }
      }
    );

    console.log('Uploaded file: ', result);
  }

  const onChange = async (e) => {
    setUploading(true)
    
    let files = [];
    for (var i=0; i<e.target.files.length; i++) {
      files.push(e.target.files.item(i));
    }
    await Promise.all(files.map(f => uploadFile(f)));

    setUploading(false)
  }

  return (
    <div>
      <Form.Button
        onClick={() => document.getElementById('add-image-file-input').click()}
        disabled={uploading}
        icon='file image outline'
        content={ uploading ? 'Uploading...' : 'Add Images' }
      />
      <input
        id='add-image-file-input'
        type="file"
        accept='image/*'
        multiple
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

const PhotosList = React.memo((props) => {
  const PhotoItems = (props) => {
    return props.photos.map(photo =>
      <S3Image 
        key={photo.thumbnail.key} 
        imgKey={'resized/' + photo.thumbnail.key.replace(/.+resized\//, '')}
        level="private"
        style={{display: 'inline-block', 'paddingRight': '5px'}}
      />
    );
  }

  return (
    <div>
      <Divider hidden />
      <PhotoItems photos={props.photos} />
    </div>
  );
})


const Search = () => {
  const [photos, setPhotos] = useState([])
  const [label, setLabel] = useState('')
  const [hasResults, setHasResults] = useState(false)
  const [searched, setSearched] = useState(false)

  const getPhotosForLabel = async (e) => {
      setPhotos([])
      const result = await API.graphql(graphqlOperation(queries.searchPhotos, { filter: { labels: { match: label }} }));
      if (result.data.searchPhotos.items.length !== 0) {
          setHasResults(result.data.searchPhotos.items.length > 0)
          setPhotos(p => p.concat(result.data.searchPhotos.items))
      }
      setSearched(true)
  }

  const NoResults = () => {
    return !searched
      ? ''
      : <Header as='h4' color='grey'>No photos found matching '{label}'</Header>
  }

  return (
      <Segment>
        <Input
          type='text'
          placeholder='Search for photos'
          icon='search'
          iconPosition='left'
          action={{ content: 'Search', onClick: getPhotosForLabel }}
          name='label'
          value={label}
          onChange={(e) => { setLabel(e.target.value); setSearched(false);} }
        />
        {
            hasResults
            ? <PhotosList photos={photos} />
            : <NoResults />
        }
      </Segment>
  );
}

function App() {
  return (
    <Router>
      <Grid padded>
        <Grid.Column>
          <Route path="/" exact component={NewAlbum}/>
          <Route path="/" exact component={AlbumsList}/>
          <Route path="/" exact component={Search}/>

          <Route
            path="/albums/:albumId"
            render={() => <div>
            <NavLink to='/'>Back to Albums list</NavLink>
          </div>}/>
          <Route
            path="/albums/:albumId"
            render={props => <AlbumDetails id={props.match.params.albumId}/>}/>
        </Grid.Column>
      </Grid>
    </Router>
  )
}

export default withAuthenticator(App, {
  includeGreetings: true,
  signUpConfig: {
    hiddenDefaults: ['phone_number']
  }
})

</textarea>
{{< /safehtml >}}

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