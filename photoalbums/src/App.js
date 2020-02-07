import React, {useState, useEffect} from 'react';

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
