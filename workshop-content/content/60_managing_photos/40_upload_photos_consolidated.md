+++
title = "Managing Photos"
chapter = false
weight = 40
+++

Now that we have an S3 bucket where our photos can get stored, we'll want to create a UI that lets us upload photos to that bucket for storage. We'll also need to track that the photo was intended to be part of a specific album that it was uploaded to, so that we can eventually load all of the photos that belong to that album.

Let's create a new _S3ImageUpload_ component that will contain an HTML file input element which will fire off an event handler when a user selects a photo. 

{{% notice info %}}
Our upload event handler will need to upload the file to S3 with some metadata annotating which album it's destined for. Luckily, the [Amplify JS Storage module](https://aws-amplify.github.io/amplify-js/media/storage_guide) makes uploading files to S3 very easy. Also, we'll need to introduce one new dependency to our app — a way to generate UUIDs — because we'll need to ensure that we're uploading files to S3 with unique names (if we used the filenames from users' devices, they could conflict).
{{% /notice %}}
 
**➡️ From the photoalbums directory, run** `npm install --save uuid @aws-amplify/storage`

Now we'll update our app by adding some imports, creating an S3ImageUpload component, and including the S3ImageUpload component in the AlbumDetails component. 
 

**➡️ Replace `src/App.js` with** <span class="clipBtn clipboard" data-clipboard-target="#idafdc9f598ebf84023a317f7cc81a5933f566e39ephotoalbumssrcAppjs">this content</span> (click the gray button to copy to clipboard). 
{{< expand "Click to view diff" >}} {{< safehtml >}}
<div id="diff-idafdc9f598ebf84023a317f7cc81a5933f566e39ephotoalbumssrcAppjs"></div> <script type="text/template" data-diff-for="diff-idafdc9f598ebf84023a317f7cc81a5933f566e39ephotoalbumssrcAppjs">commit afdc9f598ebf84023a317f7cc81a5933f566e39e
Author: Gabe Hollombe <gabe@avantbard.com>
Date:   Thu Feb 6 14:58:34 2020 +0800

    update frontend to allow for uploading and rendering of photos

diff --git a/photoalbums/src/App.js b/photoalbums/src/App.js
index 147c98e..d30b0fb 100644
--- a/photoalbums/src/App.js
+++ b/photoalbums/src/App.js
@@ -2,13 +2,16 @@ import React, {useState, useEffect} from 'react';
 
 import Amplify, {Auth} from 'aws-amplify'
 import API, {graphqlOperation} from '@aws-amplify/api'
+import Storage from '@aws-amplify/storage'
 import aws_exports from './aws-exports'
 
-import {withAuthenticator} from 'aws-amplify-react'
-import {Grid, Header, Input, List, Segment} from 'semantic-ui-react'
+import {S3Image, withAuthenticator} from 'aws-amplify-react'
+import {Divider, Form, Grid, Header, Input, List, Segment} from 'semantic-ui-react'
 
 import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
 
+import {v4 as uuid} from 'uuid';
+
 import * as queries from './graphql/queries'
 import * as mutations from './graphql/mutations'
 import * as subscriptions from './graphql/subscriptions'
@@ -117,8 +120,11 @@ const AlbumsList = () => {
 }
 
 const AlbumDetails = (props) => {
-  const [album,
-    setAlbum] = useState({name: 'Loading...', photos: []})
+  const [album, setAlbum] = useState({name: 'Loading...', photos: []})
+  const [photos, setPhotos] = useState([])
+  const [hasMorePhotos, setHasMorePhotos] = useState(true)
+  const [fetchingPhotos, setFetchingPhotos] = useState(false)
+  const [nextPhotosToken, setNextPhotosToken] = useState(null)
 
   useEffect(() => {
     const loadAlbumInfo = async() => {
@@ -129,15 +135,138 @@ const AlbumDetails = (props) => {
     loadAlbumInfo()
   }, [props.id])
 
+  useEffect(() => {
+    fetchNextPhotos()
+    // eslint-disable-next-line react-hooks/exhaustive-deps
+  }, [])
+
+  useEffect(() => {
+    let subscription
+    async function setupSubscription() {
+      const user = await Auth.currentAuthenticatedUser()
+      subscription = API.graphql(graphqlOperation(subscriptions.onCreatePhoto, {owner: user.username})).subscribe({
+        next: (data) => {
+          const photo = data.value.data.onCreatePhoto
+          if (photo.albumId !== props.id) return
+            setPhotos(p => p.concat([photo]))
+        }
+      })
+    }
+    setupSubscription()
+
+    return () => subscription.unsubscribe();
+  }, [props.id])
+
+
+  const fetchNextPhotos = async () => {
+    const FETCH_LIMIT = 20
+    setFetchingPhotos(true)
+    let queryArgs = {
+      albumId: props.id,
+      limit: FETCH_LIMIT, 
+      nextToken: nextPhotosToken
+    }
+    if (! queryArgs.nextToken) delete queryArgs.nextToken
+    const results = await API.graphql(graphqlOperation(queries.listPhotosByAlbum, queryArgs))
+    setPhotos(p => p.concat(results.data.listPhotosByAlbum.items))
+    setNextPhotosToken(results.data.listPhotosByAlbum.nextToken)
+    setHasMorePhotos(results.data.listPhotosByAlbum.items.length === FETCH_LIMIT)
+    setFetchingPhotos(false)
+  }
+
   return (
     <Segment>
       <Header as='h3'>{album.name}</Header>
-      <p>TODO LATER IN WORKSHOP: Allow photo uploads</p>
-      <p>TODO LATER IN WORKSHOP: Show photos for this album</p>
+      <S3ImageUpload albumId={album.id} />
+      <PhotosList photos={photos} />
+      {
+          hasMorePhotos && 
+          <Form.Button
+            onClick={() => fetchNextPhotos()}
+            icon='refresh'
+            disabled={fetchingPhotos}
+            content={fetchingPhotos ? 'Loading...' : 'Load more photos'}
+          />
+      }
     </Segment>
   )
 }
 
+
+const S3ImageUpload = (props) => {
+  const [uploading, setUploading] = useState(false)
+  
+  const uploadFile = async (file) => {
+    const fileName = 'upload/'+uuid();
+    const user = await Auth.currentAuthenticatedUser();
+
+    const result = await Storage.vault.put(
+      fileName, 
+      file, 
+      {
+        metadata: {
+          albumid: props.albumId,
+          owner: user.username,
+        }
+      }
+    );
+
+    console.log('Uploaded file: ', result);
+  }
+
+  const onChange = async (e) => {
+    setUploading(true)
+    
+    let files = [];
+    for (var i=0; i<e.target.files.length; i++) {
+      files.push(e.target.files.item(i));
+    }
+    await Promise.all(files.map(f => uploadFile(f)));
+
+    setUploading(false)
+  }
+
+  return (
+    <div>
+      <Form.Button
+        onClick={() => document.getElementById('add-image-file-input').click()}
+        disabled={uploading}
+        icon='file image outline'
+        content={ uploading ? 'Uploading...' : 'Add Images' }
+      />
+      <input
+        id='add-image-file-input'
+        type="file"
+        accept='image/*'
+        multiple
+        onChange={onChange}
+        style={{ display: 'none' }}
+      />
+    </div>
+  );
+}
+
+const PhotosList = React.memo((props) => {
+  const PhotoItems = (props) => {
+    return props.photos.map(photo =>
+      <S3Image 
+        key={photo.thumbnail.key} 
+        imgKey={'resized/' + photo.thumbnail.key.replace(/.+resized\//, '')}
+        level="private"
+        style={{display: 'inline-block', 'paddingRight': '5px'}}
+      />
+    );
+  }
+
+  return (
+    <div>
+      <Divider hidden />
+      <PhotoItems photos={props.photos} />
+    </div>
+  );
+})
+
+
 function App() {
   return (
     <Router>
</script>
{{< /safehtml >}} {{< /expand >}}
{{< safehtml >}}
<textarea id="idafdc9f598ebf84023a317f7cc81a5933f566e39ephotoalbumssrcAppjs" style="position: relative; left: -1000px; width: 1px; height: 1px;">import React, {useState, useEffect} from 'react';

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


function App() {
  return (
    <Router>
      <Grid padded>
        <Grid.Column>
          <Route path="/" exact component={NewAlbum}/>
          <Route path="/" exact component={AlbumsList}/>

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

### What we changed in src/App.js
- Imported v4 as uuid from *uuid*

- Imported *Divider* and *Form* from *semantic-ui-react*

- Imported *Storage* from *aws-amplify*

- Imported *S3Image* from *aws-amplify-react*

- Created new components: *S3ImageUpload* and *PhotosList*

- Updated *AlbumDetails* to support paginating photos

- Added *PhotosList* to *AlbumDetails*'s render output

### Try uploading a photo in an album

At this point there's not much to look at. **You won't be able to see any uploaded photos yet**, but you should be able to click the button, select a file, and see it change to *'Uploading…'* before switching back to an upload button again. 

{{% notice tip %}}
You can also go manually explore the S3 bucket in the AWS web console to see that the files are getting uploaded. The easiest way to find the bucket name is to look at _src/aws-exports.js_ and find the value configured for __aws_user_files_s3_bucket__. Find your bucket in the S3 web console, then look in the bucket under _public/uploads_.
{{% /notice %}}
 
{{% notice info %}}
There are a few things worth calling out in our new _S3ImageUpload_ component. It uses AWS Amplify's _Storage.vault.put_ method to upload a private file, accessible only to the user who uploaded it, into the S3 bucket we configured for our app. In this API call, we're passing in a few extra options. 
<br/><br/>
We use a UUID for the uplaoded photo name and prefix it with 'upload/' because we'll want to automatically make thumbnails for each image. We'll accomplish this shortly by adding a trigger onto the S3 bucket that will fire off a thumbnail creation function for us each time any file is added to the _uploads/_ path of the bucket. New thumbnails will also get added to the bucket and to avoid a recursive trigger loop where each thumbnail creation then causes the function to fire again, we'll scope our trigger to only execute for files that are added with a key prefix of _uploads/_.
<br/><br/>
We pass in metadata: _{ albumid: this.props.albumId }_ because we're going to have an S3 thumbnail trigger function take care of adding the information about this photo to our data store after it finishes making the thumbnail, and that function will somehow need to know what album the photo was uploaded for. We could have put the album ID in the photo key as a prefix or suffix, for example, but the metadata approach feels more appropriate. After all, this *is* metadata about the photo, right?
{{% /notice %}}
