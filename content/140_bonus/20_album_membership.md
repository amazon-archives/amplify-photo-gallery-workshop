+++
title = "Allowing Other Users To Collaborate In Albums"
chapter = false
weight = 20
+++

We can take advantage of the fact that multiple users can sign in to our app and add the ability for other people view and upload to our albums on a case-by-case basis. 

The simplest way to do this is to have each album contain a set of usernames that are allowed to view and upload photos to it. Let's see how we can make this work.


## Updating the backend

Amplify supports multiple authorization declarations on the *@model* types in our GraphQL Schema. We can add a second auth rule, stating that any user who's username is in an Album's *members* field can see (but not edit) the record.

1. **Replace /photo-albums/amplify/backend/api/photoalbums/schema.graphql** with the following:
{{< highlight graphql "hl_lines=5-8">}}
# amplify/backend/api/photo-albums/schema.graphql

type Album 
  @model 
  @auth(rules: [
    { allow: owner }
    { allow: owner, ownerField: "members", queries: [get, list], mutations: null }
  ]) {
    id: ID!
    name: String!
    owner: String
    members: [String]
    photos: [Photo] @connection(name: "AlbumPhotos")
}

type Photo 
  @model 
  @auth(rules: [{allow: owner}]) 
  @searchable {
    id: ID!
    album: Album @connection(name: "AlbumPhotos")
    bucket: String!
    fullsize: PhotoS3Info!
    thumbnail: PhotoS3Info!
    labels: [String!]
}

type PhotoS3Info {
    key: String!
    width: Int!
    height: Int!
} 
{{< /highlight >}}

2. **Run `amplify push`** to regenerate a new GraphQL schema and update our AppSync API. 

{{% notice tip %}}
You can learn more about adding multiple ownership rules to a model in [the GraphQL Transform documentation](https://aws-amplify.github.io/docs/cli/graphql#usage-1).
{{% /notice %}}


## Updating the frontend

Now that our backend has been updated to look for a list of usernames in a *members* field on our album records, all we need to do is update our UI to allow an album's owner to manage the usernames that should be considered members of the album. We'll also add in another AppSync subscription so that our listing of usernames will refresh when a new username is added to an album.

**Replace photo-albums/src/App.js** with the following updated version:
<div style="height: 595px; overflow-y: scroll;">
{{< highlight jsx "hl_lines=6 10 49-58 64-65 370-387 428-433 441-452 503-569">}}
// photo-albums/src/App.js

import React, { Component } from 'react';

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
import { Container, Divider, Form, Grid, Header, Icon, Input, List, Modal, Segment } from 'semantic-ui-react';
import {v4 as uuid} from 'uuid';

import { Connect, S3Image, withAuthenticator } from 'aws-amplify-react';
import Amplify, { API, Auth, graphqlOperation, Storage } from 'aws-amplify';

import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

function makeComparator(key, order='asc') {
  return (a, b) => {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) return 0; 

    const aVal = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
    const bVal = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (aVal > bVal) comparison = 1;
    if (aVal < bVal) comparison = -1;

    return order === 'desc' ? (comparison * -1) : comparison
  };
}


const ListAlbums = `query ListAlbums {
    listAlbums(limit: 9999) {
        items {
            id
            name
        }
    }
}`;

const SubscribeToNewAlbums = `
  subscription OnCreateAlbum {
    onCreateAlbum {
      id
      name
    }
  }
`;

const SubscribeToUpdatedAlbums = `
  subscription OnUpdateAlbum {
    onUpdateAlbum {
      id
      name
      owner
      members
    }
  }
`;

const GetAlbum = `query GetAlbum($id: ID!, $nextTokenForPhotos: String) {
    getAlbum(id: $id) {
        id
        name
        owner
        members
        photos(sortDirection: DESC, nextToken: $nextTokenForPhotos) {
            nextToken
            items {
                thumbnail {
                    width
                    height
                    key
                }
                fullsize {
                    width
                    height
                    key
                }
            }
        }
    }
}
`;

const SearchPhotos = `query SearchPhotos($label: String!) {
  searchPhotos(filter: { labels: { match: $label }}) {
    items {
      id
      bucket
      thumbnail {
          key
          width
          height
      }
      fullsize {
          key
          width
          height
      }
    }
  }
}`;


class Search extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          photos: [],
          album: null,
          label: '',
          hasResults: false,
          searched: false
      }
  }

  updateLabel = (e) => {
      this.setState({ label: e.target.value, searched: false });
  }

  getPhotosForLabel = async (e) => {
      const result = await API.graphql(graphqlOperation(SearchPhotos, {label: this.state.label}));
      let photos = [];
      let label = '';
      let hasResults = false;
      if (result.data.searchPhotos) {
          hasResults = true;
          photos = result.data.searchPhotos.items;
          label = this.state.label;
      }
      const searchResults = { label, photos }
      this.setState({ searchResults, hasResults, searched: true });
  }

  noResults() {
    return !this.state.searched
      ? ''
      : <Header as='h4' color='grey'>No photos found matching '{this.state.label}'</Header>
  }

  render() {
      return (
          <Segment>
            <Input
              type='text'
              placeholder='Search for photos'
              icon='search'
              iconPosition='left'
              action={{ content: 'Search', onClick: this.getPhotosForLabel }}
              name='label'
              value={this.state.label}
              onChange={this.updateLabel}
            />
            {
                this.state.hasResults 
                ? <PhotosList photos={this.state.searchResults.photos} />
                : this.noResults()
            }
          </Segment>
      );
  }
}


class S3ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = { uploading: false }
  }
  
  uploadFile = async (file) => {
    const fileName = uuid();

    const result = await Storage.put(
      fileName, 
      file, 
      {
        customPrefix: { public: 'uploads/' },
        metadata: { albumid: this.props.albumId }
      }
    );

    console.log('Uploaded file: ', result);
  }

  onChange = async (e) => {
    this.setState({uploading: true});
    
    let files = [];
    for (var i=0; i<e.target.files.length; i++) {
      files.push(e.target.files.item(i));
    }
    await Promise.all(files.map(f => this.uploadFile(f)));

    this.setState({uploading: false});
  }

  render() {
    return (
      <div>
        <Form.Button
          onClick={() => document.getElementById('add-image-file-input').click()}
          disabled={this.state.uploading}
          icon='file image outline'
          content={ this.state.uploading ? 'Uploading...' : 'Add Images' }
        />
        <input
          id='add-image-file-input'
          type="file"
          accept='image/*'
          multiple
          onChange={this.onChange}
          style={{ display: 'none' }}
        />
      </div>
    );
  }
}


class PhotosList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPhoto: null
    };
  }
  
  handlePhotoClick = (photo) => {
    this.setState({
      selectedPhoto: photo
    }); 
  }
  
  handleLightboxClose = () => {
    this.setState({
      selectedPhoto: null
    }); 
  }
    
  photoItems() {
    return this.props.photos.map(photo =>
      <S3Image 
        key={photo.thumbnail.key} 
        imgKey={photo.thumbnail.key.replace('public/', '')} 
        style={{display: 'inline-block', 'paddingRight': '5px'}}
        onClick={this.handlePhotoClick.bind(this, photo.fullsize)}
      />
    );
  }

  render() {
    return (
      <div>
        <Divider hidden />
        {this.photoItems()}
        <Lightbox photo={this.state.selectedPhoto} onClose={this.handleLightboxClose} />
      </div>
    );
  }
}


class NewAlbum extends Component {
  constructor(props) {
    super(props);
    this.state = {
      albumName: ''
      };
    }

  handleChange = (event) => {
    let change = {};
    change[event.target.name] = event.target.value;
    this.setState(change);
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const NewAlbum = `mutation NewAlbum($name: String!) {
      createAlbum(input: {name: $name}) {
        id
        name
      }
    }`;
    
    const result = await API.graphql(graphqlOperation(NewAlbum, { name: this.state.albumName }));
    console.info(`Created album with id ${result.data.createAlbum.id}`);
    this.setState({ albumName: '' })
  }

  render() {
    return (
      <Segment>
        <Header as='h3'>Add a new album</Header>
          <Input
          type='text'
          placeholder='New Album Name'
          icon='plus'
          iconPosition='left'
          action={{ content: 'Create', onClick: this.handleSubmit }}
          name='albumName'
          value={this.state.albumName}
          onChange={this.handleChange}
          />
        </Segment>
      )
    }
}


class AlbumsList extends React.Component {
  albumItems() {
    return this.props.albums.sort(makeComparator('name')).map(album =>
      <List.Item key={album.id}>
        <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
      </List.Item>
    );
  }

  render() {
    return (
      <Segment>
        <Header as='h3'>My Albums</Header>
        <List divided relaxed>
          {this.albumItems()}
        </List>
      </Segment>
    );
  }
}


class AlbumDetailsLoader extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nextTokenForPhotos: null,
            hasMorePhotos: true,
            album: null,
            loading: true
        }
    }

    async loadMorePhotos() {
        if (!this.state.hasMorePhotos) return;

        this.setState({ loading: true });
        const { data } = await API.graphql(graphqlOperation(GetAlbum, {id: this.props.id, nextTokenForPhotos: this.state.nextTokenForPhotos}));

        let album;
        if (this.state.album === null) {
            album = data.getAlbum;
        } else {
            album = this.state.album;
            album.photos.items = album.photos.items.concat(data.getAlbum.photos.items);
        }
        this.setState({ 
            album: album,
            loading: false,
            nextTokenForPhotos: data.getAlbum.photos.nextToken,
            hasMorePhotos: data.getAlbum.photos.nextToken !== null
        });
    }

    componentDidMount() {
      this.loadMorePhotos();
      
      const subscription = API.graphql(graphqlOperation(SubscribeToUpdatedAlbums)).subscribe({
          next: (update) => {
            const album = update.value.data.onUpdateAlbum;
            this.setState({ 
              album: Object.assign(this.state.album, album)
            })
          }
      });

      this.setState({ 
        albumUpdatesSubscription: subscription
      })
    }
    
    componentWillUnmount() {
      this.state.albumUpdatesSubscription.unsubscribe();
    }

    render() {
        return (
            <AlbumDetails 
                loadingPhotos={this.state.loading} 
                album={this.state.album} 
                loadMorePhotos={this.loadMorePhotos.bind(this)} 
                hasMorePhotos={this.state.hasMorePhotos} 
            />
        );
    }
}


class Lightbox extends Component {
  render() {
    return (
      <Modal 
        open={this.props.photo !== null} 
        onClose={this.props.onClose}
      >
        <Modal.Content>
          <Container textAlign='center'>
            { 
              this.props.photo? 
              <S3Image 
                imgKey={this.props.photo.key.replace('public/', '')} 
                theme={{ photoImg: { maxWidth: '100%' } }}
                onClick={this.props.onClose}
              /> :
              null 
            }
          </Container>
        </Modal.Content>
      </Modal>
    );
  }
}


class AlbumDetails extends Component {
    async componentDidMount() {
      this.setState({
        currentUser: await Auth.currentAuthenticatedUser()
      });
    }

    render() {
        if (!this.props.album) return 'Loading album...';
        
        return (
            <Segment>
              <Header as='h3'>{this.props.album.name}</Header>
              
              {
                this.state.currentUser.username === this.props.album.owner
                &&
                <Segment.Group>
                  <Segment>
                    <AlbumMembers members={this.props.album.members} />
                  </Segment>
                  <Segment basic>
                    <AddUsernameToAlbum albumId={this.props.album.id} />
                  </Segment>
                </Segment.Group>
              }
          
              <S3ImageUpload albumId={this.props.album.id}/>        
              
              <PhotosList photos={this.props.album.photos.items} />
              {
                  this.props.hasMorePhotos && 
                  <Form.Button
                  onClick={this.props.loadMorePhotos}
                  icon='refresh'
                  disabled={this.props.loadingPhotos}
                  content={this.props.loadingPhotos ? 'Loading...' : 'Load more photos'}
                  />
              }
            </Segment>
        )
    }
}



class AlbumsListLoader extends React.Component {
    onNewAlbum = (prevQuery, newData) => {
        // When we get data about a new album, we need to put in into an object 
        // with the same shape as the original query results, but with the new data added as well
        let updatedQuery = Object.assign({}, prevQuery);
        updatedQuery.listAlbums.items = prevQuery.listAlbums.items.concat([newData.onCreateAlbum]);
        return updatedQuery;
    }

    render() {
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



class AddUsernameToAlbum extends Component {
  constructor(props) {
    super(props);
    this.state = { username: '' };
  }

  handleChange = (e, { name, value }) => this.setState({ [name]: value })
  
  handleSubmit = async (event) => {
    event.preventDefault();
    
    const { data } = await API.graphql(graphqlOperation(GetAlbum, {id: this.props.albumId}));
    
    let updatedAlbum = data.getAlbum;
    const updatedMembers = (data.getAlbum.members || []).concat([this.state.username]);
    updatedAlbum.members = updatedMembers;
    const {id, name, owner, members} = updatedAlbum;
    const updatedAlbumInput = {id, name, owner, members};
    
    const UpdateAlbum = `mutation UpdateAlbum($input: UpdateAlbumInput!) {
      updateAlbum(input: $input) {
        id
        members
      }
    }
    `;

    const result = await API.graphql(graphqlOperation(UpdateAlbum, { input: updatedAlbumInput }));

    console.log(`Added ${this.state.username} to album id ${result.data.updateAlbum.id}`);

    this.setState({ username: '' });
  }
  
  render() {
    return (
      <Input
        type='text'
        placeholder='Username'
        icon='user plus'
        iconPosition='left'
        action={{ content: 'Add', onClick: this.handleSubmit }}
        name='username'
        value={this.state.username}
        onChange={this.handleChange}
      />
    )
  }
}



const AlbumMembers = (props) => (
  <div>
    <Header as='h4'>
      <Icon name='user circle' />
      <Header.Content>Members</Header.Content>
    </Header>
    {
      props.members
      ? <List bulleted> 
          {props.members && props.members.map((member) => <List.Item key={member}>{member}</List.Item>)}
        </List>
      : 'No members yet (besides you). Invite someone below!'
    }
  </div>
);



class App extends Component {
  render() {
    return (
      <Router>
        <Grid padded>
          <Grid.Column>
            <Route path="/" exact component={NewAlbum}/>
            <Route path="/" exact component={AlbumsListLoader}/>
            <Route path="/" exact component={Search}/>

            <Route
              path="/albums/:albumId"
              render={ () => <div><NavLink to='/'>Back to Albums list</NavLink></div> }
            />
            <Route
              path="/albums/:albumId"
              render={ props => <AlbumDetailsLoader id={props.match.params.albumId}/> }
            />
          </Grid.Column>
        </Grid>
      </Router>
    );
  }
}

export default withAuthenticator(App, {includeGreetings: true});
{{< /highlight >}}
</div>

### What we changed in src/App.js

- Imported *Icon* from semantic-ui-react and *Auth* from aws-amplify

- Added *SubscribeToUpdatedAlbums* query

- Added *owner* and *member* fields to be fetched by the *GetAlbum* query

- Subscribed to album updates inside the *AlbumDetailsLoader* component in order to trigger a re-rendering of the album when new members are added

- Updated the *AlbumDetails* component's *render()* method to include UI for managing members

- Created *AddUsernameToAlbum* and *AlbumMembers* components to handle adding and listing album members and only render these components if the user owns the album

### Try out the app

To test out our new multi-user capabilities, we'll need at least one other user to invite to an album. 

1. Sign out of the app and create a new user (don't forget to check for the verification email and submit the verification code). 

2. Sign out of the new username and back in using your original username. 

3. Navigate to an album you'd like to share and invite your new username to the album. 

4. Sign out and then back in with the new username and you'll see the album listed! You should also notice that the album membership controls aren't visible since this user doesn't own the album.