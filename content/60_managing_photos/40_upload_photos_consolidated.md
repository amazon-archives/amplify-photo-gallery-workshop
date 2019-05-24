+++
title = "사진 관리하기"
chapter = false
weight = 40
+++

사진을 저장할수 있는 S3 bucket이 생겼으니 사진을 버킷에 사진을 업로드 하도록 도와줄 UI가 필요합니다. 그리고 앨범에 속한 모든 사진들을 로드 하기 위해서 사진들이 앨범에서 어떤 특정 부분에 속하는지 추적 할수 있어야 합니다.

새로운 _S3ImageUpload_ 컴포넌트를 만들어 봅시다. 이 컴포넌트는 사용자가 사진을 선택할때 이벤트 핸들러를 실행시키는 input 엘리먼트를 가진 HTML이 포함되어 있습니다.

{{% notice info %}}
업로드 이벤트 핸들러를 통해 사진이 어떤 앨범에 들어갈지 설명하는 주석을 가진 메터데이터가 있는 파일을 S3에 업로드 합니다. 다행히 [Amplify JS Storage module](https://aws-amplify.github.io/amplify-js/media/storage_guide)을 이용하면 S3에 파일업로드 작업을 매우 쉽게 할 수 있습니다. 
그리고, 반드시 고유한 이름으로 S3에 파일을 업로드 해야하기 때문에 UUID를 생성해주는 의존 라이브러리가 필요합니다. (사용자 기기에 있는 파일 이름을 그대로 사용한다면 이름 중복 충돌이 발생할수 있습니다).
{{% /notice %}}
 
**photo-albums 디렉토리에서 다음을 수행합니다.** `npm install --save uuid`

우리 어플리케이션에 의존 라이브러리를 추가하고 S3ImageUpload 컴포넌트를 생성합니다. 그리고 컴포넌트에 생성한 S3ImageUpload 컴포넌트를 포함합니다.

**photo-albums/src/App.js**의 내용을 아래 코드로 교체합니다:
<div style="height: 660px; overflow-y: scroll;">
{{< highlight jsx "hl_lines=6-7 9-10 50-143 218-263 268-284">}}
// src/App.js

import React, { Component } from 'react';

import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
import {Divider, Form, Grid, Header, Input, List, Segment } from 'semantic-ui-react';
import {v4 as uuid} from 'uuid';

import { Connect, withAuthenticator, S3Image } from 'aws-amplify-react';
import Amplify, { API, graphqlOperation, Storage, Auth } from 'aws-amplify';

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
}`;


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

### src/App.js 변경사항
- 의존 라이브러리 추가: v4 as uuid from *uuid*

- 의존 라이브러리 추가: *Divider* and *Form* from *semantic-ui-react*

- 의존 라이브러리 추가: *Storage* from *aws-amplify*

- 의존 라이브러리 추가: *S3Image* from *aws-amplify-react*

- 페이징을 제공하기 위한  *GetAlbum* 쿼리 수정 

- 새로운 컴포넌트 생성: *S3ImageUpload* and *PhotosList*

- 페이징을 제공하기 위해 *AlbumDetailsLoader* 수정

- *AlbumDetails* 에 *PhotosList* 추가 

### 사진 업로드 하기


이 시점에서 봐야 할 것은 별로 없습니다. 업로드 버튼을 클릭하고 파일을 선택한 후, 업로드 버튼으로 다시 바뀌기 전에 *'Uploading…'* 으로 바뀌는지 확인해보세요.

{{% notice tip %}}
  AWS 웹 콘솔에서 S3 버킷을 직접 탐색하여 파일이 업로드되고 있는지 확인할 수도 있습니다. 버킷 이름을 찾는 가장 쉬운 방법은 _src / aws-exports.js_ 파일에서  __aws_user_files_s3_bucket__ 에 설정된 값을 찾는 것입니다. S3 웹 콘솔에서 bucket을 찾아 _public/uploads_ 하위에 업로드 한 파일들을 찾아봅니다.
{{% /notice %}}
 
{{% notice info %}}
  새로 생성한 _S3ImageUpload_ 컴포넌트는 몇가지 호출 기능이 있습니다. 어플리케이션에서 설정한 S3 버킷에 파일을 업로드 하기 위해 AWS Amplify의 _Storage.put_ 메소드를 사용하는데 이 API 호출할때 몇가지 추가 옵션들을 같이 전달합니다.
  <br/><br/>
  _customPrefix: { public: 'uploads/' }_  : 자동으로 각 사진들의 미리보기 이미지(thumbnail)를 만들고 싶을 때 전달합니다. S3 버킷에 미리보기 생성 기능을 실행하는 트리거가 추가 되기 때문에, 버킷의 _uploads/_ 경로에 파일이 추가 될 때마다 트리거가 바로 실행됩니다. 새로운 썸네일들이 추가되면 이 역시 버킷에 추가되기 때문에 각 썸네일이 생성될 때 마다 썸네일 생성 함수가 재 실행되는 재귀 트리거 루프가 발생할수 있습니다. 이를 피하기 위해서 키 프리픽스 _uploads/_ 를 추가하여 트리거 실행 범위를 제한합니다.
  Amplify는 공개적으로 액세스 할 수 있어야하는 파일을 특정하기 위해 접두어를 사용한다는 것을 알고 있습니다.이 파일은 Storage.put의 기본 권한 수준입니다.
  <br/><br/>
  어플리케이션을 사용하는 사용자라면 누구든지 모든 파일에 대해 접근 할 수 있도록 (API 수준에서) 하는것이 기본정책이라면 문제가 되지 않을까요? 아니요. 우리는 UUID를 사진의 키로 사용하고 있고 사용자들은 앨범의 UUID를 알고 있는 앨범에 대해서면 사진 목록에 접근할 수 있습니다.
  만약 당신이 Amplify Storage 모듈의 모든 API를 읽었다면(기본 S3 API에 익숙한 경우) 이렇게 물을지도 모르겠네요. "잠시만요, 사용자들은 공개된 경로에 있는 모든 목록을 조회할 수 있으니 모든 사진들을 볼수 있겠는데요?"
  지금은 당신이맞습니다. 나중에 이를 제한하도록 추가 예방 조치를 취해 처리할 예정입니다. (특정 사용자 이름을 활용하여 버킷 항목 리스트를 조회하지 못하도록 제한함)
  <br/><br/>
  _metadata: { albumid: this.props.albumId }_  : 
  S3 썸네일 트리거 함수가 사진에 대한 정보를 데이터 저장소에 추가 하게 합니다. 썸네일 이미지 작성 작업이 완료되고 사진이 업로드된 앨범이 무엇인지 이 옵션을 통해서 알려줍니다.
  예를 들면, 사진의 키에 앨범에 ID를 접두사(prefix)나 접미사(suffix)로 추가 할 수 있습니다. 
{{% /notice %}}
