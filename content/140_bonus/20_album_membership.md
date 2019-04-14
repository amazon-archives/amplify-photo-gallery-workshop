+++
title = "다른 유저와 앨범 공유하기"
chapter = false
weight = 20
+++

다수의 유저가 우리의 애플리케이션으로 접속할 수 있다는 장점을 이용하여 다른 유저들이 상황에 따라 우리의 앨범을 보고 업로드 할 수 있는 기능을 넣을 수 있습니다.

가장 쉬운 방법은 각각의 앨범에 유저들의 이름(usernames)을 포함하여 그들이 이 앨범 보고 새로운 사진을 업로드할 수 있도록 하는 것입니다. 


## 백엔드 수정하기

Amplify는 GraphQL 스키마 안의 *@model* 타입에서 여러 개의 권한 선언을 지원합니다. 우리는 두 번째 권한 규칙을 추가함으로서 Album의 *members* 필드에 있는 유저가 해당 레코드를 볼 수 있게 할 수 있습니다. 다만, 레코드를 수정할 권한은 없습니다.

1. **/photo-albums/amplify/backend/api/photoalbums/schema.graphql** 에 위치한 코드를 아래 코드로 대체해 주세요:
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

2. 새로운 GraphQL를 재생성하고 AppSync API를 갱신하기 위해서   **`amplify push` 명령을 실행해 주세요**. 

{{% notice tip %}}
[GraphQL Transform 문서](https://aws-amplify.github.io/docs/cli/graphql?sdk=js)를 통하여 모델에 여러 개의 소유권 규칙을 추가하는 방법에 대해 더 알아볼 수 있습니다.
{{% /notice %}}


## 프런트엔드 수정하기

이제 우리의 백엔드는 앨범 레코드 내의 *members* 필드 속에서 usernames 목록을 찾도록 수정되었습니다. 추가로 우리가 해야 할 일은 UI를 수정하여 앨범의 소유자가 앨범의 구성원으로서(members) 속해야 할 유저들(usernames)을 관리할 수 있도록 하는 것입니다. 또한, 또 다른 AppSync 구독에 추가함으로서 앨범에 새로운 유저가 추가될 때마다 유저 목록이 갱신되도록 할 것입니다. 

아래 갱신된 버전의 코드로 **photo-albums/src/App.js 를 대체해 주세요**:
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
      if (result.data.searchPhotos.items.length !== 0) {
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

### src/App.js 에서 무엇이 수정되었나요

- semantic-ui-react에서 *Icon* 를, aws-amplify에서 *Auth* 를 불러왔습니다. 

- *SubscribeToUpdatedAlbums* 쿼리를 추가하였습니다.

- *GetAlbum* 쿼리로 가져오는(fetch) *owner* 와 *member* 필드를 추가 하였습니다.

- 새로운 멤버가 추가 되었을 때 앨범을 다시 렌더링 하는 작업을 발생시키기 위하여 *AlbumDetailsLoader* 컴포넌트 내에서 앨범의 갱신을 구독하였습니다.

- 멤버들을 관리하기 위한 UI를 추가하기 위하여 *AlbumDetails* 컴포넌트 속의 *render()* 메소드를 수정하였습니다.

- 유저 추가 기능과 목록화(listing)를 제공하기 위해서 앨범의 소유자에게만 보이는 *AddUsernameToAlbum* 와 *AlbumMembers* 컴포넌트 를 생성하였습니다. 

### 앱을 작동시켜 보세요

새로운 multi-user 기능을 사용하기 위해서는 앨범에 초대할 한명 이상의 유저가 필요합니다. 

1. 앱에 로그아웃하고 새로운 유저를 생성합니다 (인증 메일을 확인하는 것과 인증 코드를 제출하는 것을 잊지 마세요). 

2. 새로운 유저에서 로그아웃하고 기존의 유저로 다시 로그인합니다. 

3. 공유하고 싶은 앨범으로 이동한 뒤 새로운 유저를 앨범에 초대합니다. 

4. 로그아웃하고 다시 새로운 유저로 로그인하면 해당 앨범이 보일 것입니다! 또한 새로운 유저가 앨범에 대한 소유권이 없기 때문에 앨범 멤버쉽 관리 기능이 보이지 않는 것을 알 수 있습니다.