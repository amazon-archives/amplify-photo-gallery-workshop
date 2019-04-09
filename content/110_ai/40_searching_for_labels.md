+++
title = "사진을 레이블로 검색하기"
chapter = false
weight = 40
+++

백엔드 작업이 완료되었으니 이제 사진을 레이블로 검색할 수 있게 하겠습니다.

새 *Search* 컴포넌트를 생성하고 *App* 컴포넌트에 루트 경로로 표시되도록 추가합니다. *Search* 컴포넌트에서 검색된 모든 사진을 표시하기위해 이미 생성한 *PhotoList* 컴포넌트를 재사용합니다.

**photo-albums/src/App.js을 다음 내용으로 변경합니다**.
<div style="height: 595px; overflow-y: scroll;">
{{< highlight jsx "hl_lines=67-144 408">}}
// photo-albums/src/App.js

import React, { Component } from 'react';

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
import { Divider, Form, Grid, Header, Input, List, Segment } from 'semantic-ui-react';
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

### 바뀐 것들

- 레이블로 사진을 검색하기 위해 *SearchPhotos* 쿼리를 추가했습니다.

- *SearchPhotos* 쿼리를 사용하여 레이블에 일치하는 사진 목록을 얻어오고, 기존 *PhotosList* 컴포넌트를 사용하여 사진을 표시하는 *Search* 컴포넌트를 추가했습니다.

- 루트 '/' 경로의 일부로 표시할 *SearchPhotos* 컴포넌트를 추가했습니다.

### 사진 검색 기능 시험하기
이제 웹 앱의 루트 경로 '/'로 돌아가면 검색할 수 있습니다.

Amplify로 Amazon Elasticsearch Service를 연동하도록 구성했지만, 생성시에 DynamoDB의 기존 데이터를 전달하지 않기 때문에 오직 새 데이터만을 색인을 생성합니다. 검색 결과를 보려면 먼저 몇 장의 사진을 앨범에 업로드해야 합니다.

한번 해 봅시다!

{{% notice note %}}
사진을 검색하기 전에 이전 페이지의 `amplify push`가 완료되었는지 확인하십시요.
<br/>
<br/>
사진 검색 기능을 테스트하려면 DynamoDB에 Photos 테이블에 검색어로 사용할 유효한 레이블이 있는지 찾아 보아야 합니다. Rekognition에서 감지된 것과 정확히 일치하는 레이블을 입력해야 합니다.
{{% /notice %}}