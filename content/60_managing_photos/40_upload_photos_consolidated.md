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
 
**From the photoalbums directory, run** `npm install --save uuid`

Now we'll update our app by adding some imports, creating an S3ImageUpload component, and including the S3ImageUpload component in the AlbumDetails component. 

**Replace photoalbums/src/App.js** with this updated version:
<div style="height: 660px; overflow-y: scroll;">
{{< highlight jsx "hl_lines=5-6 9-10 49-143 220-263 274-283">}}
// src/App.js

import React, { Component } from 'react';

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
import { Divider, Form, Grid, Header, Input, List, Segment } from 'semantic-ui-react';
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

const GetAlbum = `query GetAlbum($id: ID!, $nextTokenForPhotos: String) {
    getAlbum(id: $id) {
    id
    name
    photos(sortDirection: DESC, nextToken: $nextTokenForPhotos) {
      nextToken
      items {
        thumbnail {
          width
          height
          key
        }
      }
    }
  }
}
`;


class S3ImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = { uploading: false }
  }
  
  uploadFile = async (file) => {
    const fileName = uuid();
    const user = await Auth.currentAuthenticatedUser();

    const result = await Storage.put(
      fileName, 
      file, 
      {
        customPrefix: { public: 'uploads/' },
        metadata: { albumid: this.props.albumId, owner: user.username }
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
  photoItems() {
    return this.props.photos.map(photo =>
      <S3Image 
        key={photo.thumbnail.key} 
        imgKey={photo.thumbnail.key.replace('public/', '')} 
        style={{display: 'inline-block', 'paddingRight': '5px'}}
      />
    );
  }

  render() {
    return (
      <div>
        <Divider hidden />
        {this.photoItems()}
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


class AlbumDetails extends Component {
    render() {
        if (!this.props.album) return 'Loading album...';
        
        return (
            <Segment>
            <Header as='h3'>{this.props.album.name}</Header>
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
                {({ data, loading }) => {
                    if (loading) { return <div>Loading...</div>; }
                    if (!data.listAlbums) return;

                return <AlbumsList albums={data.listAlbums.items} />;
                }}
            </Connect>
        );
    }
}


class App extends Component {
  render() {
    return (
      <Router>
        <Grid padded>
          <Grid.Column>
            <Route path="/" exact component={NewAlbum}/>
            <Route path="/" exact component={AlbumsListLoader}/>

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
- Imported v4 as uuid from *uuid*

- Imported *Divider* and *Form* from *semantic-ui-react*

- Imported *Storage* from *aws-amplify*

- Imported *S3Image* from *aws-amplify-react*

- Updated *GetAlbum* query to support paginating photos

- Created new components: *S3ImageUpload* and *PhotosList*

- Updated *AlbumDetailsLoader* to support paginating photos

- Added *PhotosList* to *AlbumDetails*'s render output

### Try uploading a photo in an album

At this point there's not much to look at, but you should be able to click the button, select a file, and see it change to *'Uploading…'* before switching back to an upload button again. 

{{% notice tip %}}
You can also go manually explore the S3 bucket in the AWS web console to see that the files are getting uploaded. The easiest way to find the bucket name is to look at _src/aws-exports.js_ and find the value configured for __aws_user_files_s3_bucket__. Find your bucket in the S3 web console, then look in the bucket under _public/uploads_.
{{% /notice %}}
 
{{% notice info %}}
There are a few things worth calling out in our new _S3ImageUpload_ component. It uses AWS Amplify's _Storage.put_ method to upload a file into the S3 bucket we configured for our app. In this API call, we're passing in a few extra options. 
<br/><br/>
We pass in _customPrefix: { public: 'uploads/' }_ because we'll want to automatically make thumbnails for each image. We'll accomplish this shortly by adding a trigger onto the S3 bucket that will fire off a thumbnail creation function for us each time any file is added to the _uploads/_ path of the bucket. New thumbnails will also get added to the bucket and to avoid a recursive trigger loop where each thumbnail creation then causes the function to fire again, we'll scope our trigger to only execute for files that are added with a key prefix of _uploads/_. Amplify knows to use our prefix because we specified that it was for files that should be publicly accessible, which is the default permission level for Storage.put.
<br/><br/>
Is it a problem that the default is for all files to be accessible (at the API level) to any of our users in the app? No. This is acceptable since we're using unguessable UUIDs for the photo keys, and users will only be able to retrieve a list of photos for an album if they know that album's UUID as well. If you go read all of the Amplify Storage module's API (or if you're familiar with the underlying S3 API), you might ask “but wait, users can just list all of the objects in the public path and see all of the photos!” For now, you're right, but we'll deal with that later, after our app is working and we take additional precautions to lock it down further (by restricting album listing to certain usernames and by preventing users from listing items in the bucket).
<br/><br/>
We pass in metadata: _{ albumid: this.props.albumId }_ because we're going to have an S3 thumbnail trigger function take care of adding the information about this photo to our data store after it finishes making the thumbnail, and that function will somehow need to know what album the photo was uploaded for. We could have put the album ID in the photo key as a prefix or suffix, for example, but the metadata approach feels more appropriate. After all, this *is* metadata about the photo, right?
{{% /notice %}}
