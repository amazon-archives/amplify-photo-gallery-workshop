+++
title = "앨범 관리"
chapter = false
weight = 5
+++

이 시점에서 사용자를 인증하는 웹 앱과 앨범 데이터를 만들고 읽을 수있는 안전한 GraphQL API 엔드 포인트가 있습니다. 이제 둘을 연결하는 시간입니다!


{{% notice info %}}
위에서 보았 듯이 [AWS Amplify] (https://aws.github.io/aws-amplify/)는 웹 또는 React Native 앱에 다수의 클라우드 서비스를 통합하기가 쉬운 오픈 소스 JavaScript 라이브러리입니다. 먼저 [Connect React 구성 요소] (https://aws-amplify.github.io/docs/js/api#connect)를 사용하여 GraphQL API를 자동으로 쿼리하고 React 구성 요소에 대한 데이터를 제공합니다. 렌더링 할 때 사용합니다.
<br/><br/>

Amplify CLI는 이미 *src/aws-exports.js* 파일에 AppSync API와 통신하기 위해 Amplify JS 라이브러리에 전달해야하는 모든 구성이 포함되어 있는지 확인했습니다. 우리가해야 할 일은 API와 상호 작용할 새로운 코드를 추가하는 것뿐입니다.
{{% /notice %}}

다음은 앨범 목록을 렌더링 할때의 모습입니다:
![Rendering a list of albums in our app](/images/app-albums-screen.png?classes=border)

### 앱 업데이트

프런트 엔드를 다음과 같이 업데이트 해 보겠습니다.
- 사용자가 앨범을 만들 수 있도록 허용
- 앨범 목록보기
- 사용자가 앨범을 클릭하면 세부 정보를 볼 수 있습니다.

**사진 앨범 디렉토리**에서 라우팅을 위해 새로운 종속성을 추가하려면 다음을 실행하십시오.
`npm install --save react-router-dom`

{{% notice note %}}
일반적으로 각 구성 요소에 대해 별도의 파일을 만들지 만 여기서는 모든 것을 함께 유지하므로 모든 프런트 엔드 코드를 한 곳에서 볼 수 있습니다.
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

- aws-amplify-react에서 *Connect* 구성 요소 가져오기.

- semantic-ui-react에서 더 많은 프리젠 테이션 구성 요소를 가져 왔습니다.

- aws-amplify에서 *API* 및 *graphqlOperation* 가져오기.

- react-router-dom에서 라우팅 구성 요소 가져오기.

- makeComparator를 추가하여 JS에서 문자열을 안전하게 정렬 할 수있게했습니다.

- *NewAlbum*, *AlbumsList*, *AlbumsDetailsLoader*, *AlbumDetails*, *AlbumsListLoader* 새로운 구성 요소 추가

- *ListAlbums*, *SubscribeToNewAlbums*, *GetAlbum* GraphQL 쿼리 및 변이 추가

- 현재 URL 경로를 기반으로 다양한 구성 요소를 제공하도록 App 구성 요소를 업데이트했습니다.

### 앱을 한번 사용해보십시오.

지금 앱을 확인하고 새로운 기능을 사용해보십시오.

- 앨범 목록보기

- 새 앨범을 만들고 앨범 목록에 나타납니다.

- 앨범 세부 정보보기의 시작을 보려면 앨범을 클릭하십시오.

- 앨범을 볼 때 '앨범 목록으로 돌아 가기'를 클릭하면 집으로 돌아갑니다.


{{% notice tip %}}
이 로딩 마법은 AWS Amplify의 *Connect* 구성 요소 (https://aws-amplify.github.io/docs/js/api#connect) (*aws-amplify-react* 패키지에서 가져온 것입니다). 우리가해야 할 일은이 컴포넌트를 쿼리 prop에 GraphQL 쿼리 연산을 전달하는 것뿐입니다. 구성 요소가 마운트 될 때 해당 쿼리를 실행하고 데이터,로드 및 오류 인수를 통해 하위 함수에 정보를 전달합니다. 우리는이 값을 사용하여 일부로드 텍스트를 표시하거나 성공적으로 가져온 데이터를 *AlbumsList* 구성 요소로 전달합니다.
{{% /notice %}}

{{% notice info %}}
위에서 사용한 *listAlbums* 쿼리는 매우 높은 제한 인수로 전달됩니다. 이는 하나의 요청으로 모든 앨범을로드하고 페이지 매김 된 DynamoDB 응답을 처리하는 대신 클라이언트 측에서 사전 순으로 앨범을 정렬 할 수 있기 때문입니다. 이것은 *AlbumsList* 코드를 매우 간단하게 유지하므로 성능이나 네트워크 비용면에서 그럴 가치가 있습니다.
{{% /notice %}}

{{% notice info %}}
새로운 앨범이 만들어 질 때마다 AppSync 실시간 구독을 활용하여 앨범 목록을 자동으로 새로 고치는 방법도 주목할 가치가 있습니다.
<br/>
<br/>
Google의 GraphQL 스키마에는 *Album* 유형에 대한 AWS AppSync에서 DynamoDB 테이블 및 AWS AppSync 확인자와 같은 리소스를 만들었을 때 자동으로 생성 된 구독 항목이 포함 된 *Subscription* 유형이 포함되어 있습니다. 이 중 하나가 _onCreateAlbum_ 구독입니다.
<br/>
<br/>
_Connect_ 구성 요소의 _subscription_ 및 _onSubscriptionMsg_ 속성은 _onCreateAlbum_ 이벤트 데이터를 구독하고 그에 따라 *AlbumsList*의 데이터를 업데이트하도록 지시합니다.
<br/>
<br/>
구독 속성의 콘텐츠는 이전에 query 속성에 대해 제공 한 것과 매우 유사합니다. 우리가 듣고 자하는 구독을 지정하는 질의와 새로운 데이터가 도착했을 때 우리가 다시 원했던 필드를 포함합니다. 약간 까다로운 점은 subscription의 새 데이터에 반응하는 핸들러 함수를 정의해야한다는 것입니다.이 함수는 _Connect_ 구성 요소가 _ListAlbums_ 구성 요소를 새로 고치는 데 사용할 새로운 데이터 집합을 반환해야합니다. 이것은 우리가 위에서 한 것입니다.
{{% /notice %}}
