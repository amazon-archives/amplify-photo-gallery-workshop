+++
title = "앨범 관리"
chapter = false
weight = 5
+++

우리가 만든 웹어플리케이션은 사용자를 인증하는 기능과 안전하게 앨범 데이터를 만들고 조회하는 GraphQL API 엔드포인트가 있습니다. 이 두가지 기능을 연결해보겠습니다!


{{% notice info %}}
[AWS Amplify](https://aws.github.io/aws-amplify/)는 웹 또는 React Native 앱에 여러 클라우드 서비스를 쉽게 연동해주는 오픈소스 JavaScript라이브러리 입니다. 
이제 [Connect React 컴포넌트](https://aws-amplify.github.io/docs/js/api#connect)를 사용하여 리액트 컴포넌트가 렌더링 될 때 필요한 데이터를 자동으로 조회해 오도록 GraphQL API로 쿼리를 수행해봅시다.
<br/><br/>
Amplify CLI는 이미 *src/aws-exports.js*에 포함된 모든 설정값을 읽어들였기 때문에 AppSync API와 통신하기 위한 설정 값을 알고 있습니다(Amplify JS 라이브러리에 전달할 설정값이 무엇인지 고민하지 않아도 됩니다). 우리는 API와 상호 작용할 새로운 코드를 추가하기만 하면 됩니다.
{{% /notice %}}

다음은 앨범 목록을 렌더링 할때의 모습입니다:
![Rendering a list of albums in our app](/images/app-albums-screen.png?classes=border)

### 앱 업데이트

프런트엔드를 다음과 같이 업데이트 해 보겠습니다.   

  - 새로운 앨범 생성하기  
  - 앨범 목록보기   
  - 앨범을 클릭하면 앨범 세부정보 확인하기    

**사진 앨범 디렉토리**에서 다음 명령어를 수행하여 라우팅을 위한 라이브러리를 설치합니다.
`npm install --save react-router-dom`

{{% notice note %}}
일반적으로 컴포넌트 및 요소 별로 각각의 별도 파일을 만들지만 이번 워크샵에서는 App.js 파일 안에서 모든 코드를 작성하겠습니다.
{{% /notice %}}

**photo-albums/src/App.js**를 다음과 같이 바꾸십시오:

{{< highlight jsx "hl_lines=5 6 8 9 14-207">}}
// src/App.js

import React, { Component } from 'react';

import { Grid, Header, Input, List, Segment } from 'semantic-ui-react';
import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';

import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { Connect, withAuthenticator } from 'aws-amplify-react';

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


const GetAlbum = `query GetAlbum($id: ID!) {
  getAlbum(id: $id) {
    id
    name
  }
}
`;


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
  render() {
    return (
      <Connect query={graphqlOperation(GetAlbum, { id: this.props.id })}>
        {({ data, loading }) => {
          if (loading) { return <div>Loading...</div>; }
          if (!data.getAlbum) return;

          return <AlbumDetails album={data.getAlbum} />;
        }}
      </Connect>
    );
  }
}


class AlbumDetails extends Component {
  render() {
    return (
      <Segment>
        <Header as='h3'>{this.props.album.name}</Header>
        <p>TODO: Allow photo uploads</p>
        <p>TODO: Show photos for this album</p>
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

### src/App.js에서 변경된 내용

- aws-amplify-react에서 *Connect* 컴포넌트 추가

- semantic-ui-react에서 UI 컴포넌트 추가

- aws-amplify에서 *API* 및 *graphqlOperation* 추가

- react-router-dom에서 라우팅 컴포넌트 추가

- makeComparator를 추가하여 JS에서 문자 정렬 기능 추가

- *NewAlbum*, *AlbumsList*, *AlbumsDetailsLoader*, *AlbumDetails*, *AlbumsListLoader* 컴포넌트 추가

- *ListAlbums*, *SubscribeToNewAlbums*, *GetAlbum* GraphQL 쿼리 및 변이(mutations) 추가

- 현재 URL 경로를 기반으로 다양한 컴포넌트를 제공하도록 App 컴포넌트를 업데이트 (라우팅 적용)

### 앱을 실행해보세요.

어플리케이션을 다시 실행하여 새로운 기능을 확인합니다.

- 앨범 목록을 확인합니다.

- 새 앨범을 만들고 앨범 목록에 새로 추가한 앨범이 조회되는지 확인합니다.

- 앨범 세부정보를 확인합니다.

- 앨범을 볼 때 '앨범 목록으로 돌아 가기'를 클릭하면 앨범 목록리스트로 돌아갑니다.


{{% notice tip %}}
AWS Amplify의 *Connect* 컴포넌트(https://aws-amplify.github.io/docs/js/api#connect) (*aws-amplify-react* 패키지로부터 임포트)를 통해 앨범 데이터가 로딩됩니다.  
우리는 이 컴포넌트를 query prop에 GraphQL 쿼리 연산을 담아 전달하기만 하면 됩니다. 컴포넌트가 마운트 될 때 해당 쿼리가 실행되고 자식 함수에게 데이터, 로딩, 에러를 인자(arguments)로 전달합니다. 
전달된 인자들을 이용하여 로딩 텍스트를 보여주거나, 성공적으로 페치된 데이터를 *AlbumsList* 컴포넌트에게 전달함으로 적절히 렌더링 작업을 수행합니다.
{{% /notice %}}

{{% notice info %}}
위에서 사용한 *listAlbums* 쿼리는 매우 높은 제한 인자를 전달합니다.(listAlbums(limit: 9999)) 한번의 요청으로 모든 앨범 정보를 가져와서 클라이언트 사이드에서 사전순서로 정렬합니다. (페이징 처리된 DynamoDB 응답을 활용하지 않습니다.) 이 방법은 *AlbumsList* 코드를 매우 간단하게 유지하므로 성능이나 네트워크 비용 측면에서 활용할 가치가 있습니다.
{{% /notice %}}

{{% notice info %}}
새로운 앨범이 만들어 질 때마다 AppSync 실시간 구독을 활용하여 앨범 목록이 자동으로 갱신되는 것도 주목해주세요.
<br/>
<br/>
GraphQL 스키마에는 *Subscription* 타입이 포함되어 있습니다. AWS AppSync에서 AWS 리소스를 만들 때 (DynamoDB 테이블 및 AWS AppSync 리졸버와 같은) 여러 구독 요소들이 자동으로 함께 생성됩니다. _onCreateAlbum_ Subscription이 그 중 하나에 해당합니다.
<br/>
<br/>
_Connect_ 컴포넌트의 _subscription_ 속성을 통해 _onCreateAlbum_ 의 이벤트 데이터를 구독하고 _onSubscriptionMsg_ 속성을 통해 _onCreateAlbum_ 이벤트가 발생하면 *AlbumsList* 의 데이터를 업데이트하도록 지시합니다.
<br/>
<br/>
Subscription 속성 내용은 query 속성으로 제공한 것들과 매우 유사해 보입니다. 우리가 수신할 Subscription이 무엇인지 지정하고, 새로운 데이터로 채워야할 필드가 무엇인지 포함된 쿼리일 뿐입니다. 약간 까다로운 점은 subscription으로 부터 받아온 새 데이터를 처리할 핸들러 함수를 정의 해야한다는 것인데 이 핸들러 함수는 _Connect_ 컴포넌트가 _ListAlbums_ 컴포넌트를 갱신하는데 필요한 새로운 데이터를 반환하도록 구현해야합니다. 위 코드에 구현되어 있습니다.
{{% /notice %}}
