+++
title = "LIGHTBOX 만들어 전체 크기의 사진들 보기"
chapter = false
weight = 10
+++

아직 우리는 유저가 앱에서 썸네일을 클릭하여 더 큰 사진을 볼 수 있도록 하는 기능을 다루지 않았습니다. 이미 우리는 API로부터 전체 크기와 썸네일 크기의 데이터 모두를 가지고 올 수 있기 때문에, 프런트엔드 앱에 몇줄 정도 코드를 추가하는 것 만으로도 이 기능을 제공할 수 있습니다.

## 프런트엔드 수정하기

아래의 수정된 버전으로 **photo-albums/src/App.js를 대체** 해 주세요:
<div style="height: 595px; overflow-y: scroll;">
{{< highlight jsx "hl_lines=6 61-65 209-226 234 244 371-394">}}
// photo-albums/src/App.js

import React, { Component } from 'react';

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
import { Container, Divider, Form, Grid, Header, Input, List, Modal, Segment } from 'semantic-ui-react';
import {v4 as uuid} from 'uuid';

import { Connect, S3Image, withAuthenticator } from 'aws-amplify-react';
import Amplify, { API, graphqlOperation, Storage } from 'aws-amplify';

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

- semantic-ui-react로부터 *Container* 와 *Modal* 컴포넌트들을 불러왔습니다.

- *GetAlbum* GraphQL의 쿼리에 필드를 추가함으로서 전체 크기의 사진 정보를 가져올 수 있습니다.

- 현재 선택된 사진을 알기 위해서 *PhotosList* 컴포넌트를 수정하여 중첩된 *Lightbox* 컴포넌트로 전달하였습니다.

- 선택된 사진의 전체 크기 사진을 모달 화면에서 렌더링 하기 위해서 *Lightbox* 컴포넌트를 생성하였습니다.

### 앱을 작동시켜 보세요

앱을 한 번 더 확인한 후 썸네일을 클릭해 보세요. 이제 전체 크기 사진이 팝업되는 것을 볼 수 있을 것입니다. 전체 크기 사진을 클릭함으로서 썸네일 사진의 뷰로 돌아갈 수 있습니다.
