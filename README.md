## MineSweeper

![mine](https://github.com/Bumang-Cyber/webgame-mine-sweeper/assets/126222848/a83242ff-ff36-4c85-be55-fc7a758305bb)

## 배포 링크

https://webgame-mine-sweeper.netlify.app

## 구현 기간

2024.03.04 - 2024.03.07 (총 4일)

## 구현 사항

모두 구현 완료

- [x] 주어진 링크의 지뢰찾기 게임을 구현 해주세요.
- [x] 첫 번째 빈칸을 열었을 경우에는 지뢰가 터지면 안됩니다.
- [x] 게임 타이머 구현해주세요.
- [x] 오른쪽 클릭 깃발 기능
- [x] 난이도 변경이 가능해야 합니다
  - [x] Beginner (8X8) 지뢰 10개, Intermediate (16X16) 지뢰 40개, Expert (32X16) 지뢰 100개
  - [x] Custom (가로, 세로, 지뢰 수 조정 가능)
    - [x] 설정 가능한 가로, 세로는 최대 100 x 100이며, 지뢰수는 격자칸 수의 1/3 이하로 설정 가능합니다.
- [x] 전역상태관리로는 redux-toolkit을 사용합니다.

<br>

## 추가 구현 사항

- [x] 렌더링 최적화
- [x] 난이도 데이터 저장 (브라우저 새로고침 시 유지)
- [x] 사용자 친화적인 UI/UX

<br>

## 실행 방법

```shell
npm i
npm run dev
```

<br>

## 사용 라이브러리

- redux-toolkit (전역상태 관리)
- react-icons (아이콘 라이브러리)
- styled-components (CSS 라이브러리)

<br>

## 구현 아이디어

### 1. 전역 상태로 레벨 관리 ([자세히 보기](https://bumang.tistory.com/147))

- 레벨 전환 시 현재 선택된 레벨의 타일 X,Y길이와 마인 갯수로 전역 상태로 관리합니다.

```javascript
const initialState: InitialState = {
  value: {
    TITLE: "Beginner",
    X: 8,
    Y: 8,
    MINE: 10,
  },
};
```

### 2. 맵 초기화 ([자세히 보기](https://bumang.tistory.com/148))

- 2차원 배열 타일맵을 전역상태로 관리합니다. `ex: [[{...}, {...}, {...}, ... ], [{...}, {...}, {...}, ... ], [...]]`
- 2차원 배열의 각각 cell에는 아래와 같은 정보 객체가 있습니다.
- 상태들에 따라 각기 다른 식으로 렌더 됩니다.

```javascript
export interface TileType {
  // 타일 아이디
  id: string;

  // 왼쪽 클릭으로 전환 가능한 옵션
  isOpened: boolean; // 열림 여부
  isMined: boolean; // 지뢰 유무 여부

  // 오른쪽 클릭으로 전환 가능한 옵션
  isStaled: boolean; // 보통 상태인지 아닌지
  isFlagged: boolean; // 깃발이 꽃혀져 있는지 아닌지
  isQuestioned: boolean; // 물음표 상태인지 아닌지

  mineNearby: number; // 근처 지뢰의 갯수
}
```

### 3. 유저의 클릭과 동시에 게임 플레이 초기화(지뢰 심기, 타이머 시작) ([자세히 보기](https://bumang.tistory.com/148))

- 이미 지뢰가 깔려있는 타일을 눌러서 처음부터 게임오버될 가능성을 없애기 위해서 유저 클릭 시 지뢰를 뿌려줍니다.
- 유저가 클릭한 좌표와 전후좌우 8방향에는 지뢰가 없도록 구현하였습니다.
- while문으로 지뢰 갯수가 현재 레벨의 지뢰수만큼 찰 때까지 Math.random함수로 랜덤좌표에 뿌려줍니다.

```javascript
// useInitializeGame훅
const useIntializeGame = ({ tileMapArr, colIndex, rowIndex, onSetTileMap }: initializeProps) => {
  const { currentLevel } = useLevelSwitch(); // 현재 레벨 저장 훅
  const { MINE, X, Y } = currentLevel; // 마인과 X,Y축 길이 불러옴

  const GenRandomMineHandler = () => {
    const copy = [...tileMapArr];

    let mined = 0; // 마인 갯수
    const maxMineAmount = MINE;
    while (mined < maxMineAmount) {
      // X,Y축 이내로 랜덤 좌표 생성
      const randomY = Math.floor(Math.random() * Y);
      const randomX = Math.floor(Math.random() * X);

      const target = copy[randomY][randomX];
      if (
        // 유저가 클릭한 Index와 겹치거나 인접하면 다시 생성
        randomY >= rowIndex - 1 &&
        randomY <= rowIndex + 1 &&
        randomX >= colIndex - 1 &&
        randomX <= colIndex + 1
      )
        continue;
        // 이미 생성 됐던 좌표면 다시 생성
      if (target?.isMined) continue;

      mined++; // 지뢰 총량 + 1
      target.isMined = true; // 지뢰 심기
      markNearbyAmount(randomX, randomY, copy); // 지뢰 생성 좌표 근처 8방향으로 지뢰 갯수 +1 해주는 함수
      ...
```

### 4. BFS로 2차원 배열을 순회하며 근처 지뢰가 없는 타일들만 열고 근처 지뢰가 있는(숫자가 있는) 타일을 만나면 멈추기 구현 ([자세히 보기](https://bumang.tistory.com/149))

- 자바스크립트 배열에는 shift 메소드가 있기 때문에 이를 queue로 사용할수도 있지만 이를 사용했을 때 성능이 좋지 않아 따로 queue를 구현해주었습니다.
  (자바스크립트 배열은 shift 실행 직후 재정렬에 시간을 O(N)의 시간을 또 쓰기 때문입니다.)

```javascript
import { TileType } from "@/types/tile";
import { Queue } from "./queue"; // queue자료구조

const detectByBfs = (Y: number, X: number, tileMapArr: TileType[][]) => {
  const queue = new Queue();

  tileMapArr[Y][X].isQuestioned = false;
  queue.enqueue([Y, X]);
  while (queue.getLength() !== 0) {
    const cur = queue.dequeue();
    if (!cur) return;

    const [curY, curX] = cur;

    tileMapArr[curY][curX].isOpened = true;
    if (tileMapArr[curY][curX].mineNearby > 0) return;

    for (const nxt of [ // 현재 타일의 전후좌우 8방향 순회
      [curY - 1, curX],
      [curY + 1, curX],
      [curY, curX - 1],
      [curY, curX + 1],
      [curY - 1, curX - 1],
      [curY - 1, curX + 1],
      [curY + 1, curX - 1],
      [curY + 1, curX + 1],
    ]) {
      if (
        tileMapArr[nxt[0]] !== undefined && //
        tileMapArr[nxt[0]][nxt[1]] !== undefined &&
        tileMapArr[nxt[0]][nxt[1]].isMined === false &&
        tileMapArr[nxt[0]][nxt[1]].isOpened === false
      ) {
        tileMapArr[nxt[0]][nxt[1]].isOpened = true;
        if (tileMapArr[nxt[0]][nxt[1]].mineNearby === 0) {
          queue.enqueue(nxt as number[]);
        }
      }
    }
  }

  return;
};

export default detectByBfs;

```

<br>
<br>

## 간단 기능 소개

### 1. 지뢰찾기를 플레이할 수 있습니다.

- 첫 번째 빈칸을 클릭 시 지뢰가 터지지 않습니다.

<img src="./src/assets/1.gif">

<br>
<br>

### 2. 레벨 전환 및 커스텀 설정을 할 수 있습니다.

- 게임 도중, 게임 오버 시 상관없이 언제나 레벨을 바꾸고 초기화할 수 있습니다.
- 커스텀 설정은 X: 100, Y: 100 이내로 만들 수 있으며 지뢰는 1/3로 설정 가능합니다.

<img src="./src/assets/2.gif">

<br>
<br>

### 3. 성공 시 내 스코어가 보입니다.

- 현재 기록과 최고 기록을 볼 수 있습니다.

<img src="./src/assets/3.gif">

<br>
<br>

## 추가 구현 사항 설명

### 1. 렌더링 최적화

- 보통 재귀함수로 구현하는 DFS가 더욱 짧은 코드로 구현 가능하지만 2차원 배열을 순회할 때 BFS보다 성능 효율은 떨어집니다. 특히 맵 설정이 100x100 이상의 사이즈까지 가능하기 때문에 DFS 재귀함수로 구현할 시 콜스택의 오버플로우가 발생할 수 있다는 점을 고려하여 BFS를 선택하였습니다.

### 2. 사용자 친화적인 UI/UX

- 호버 시 내가 클릭 가능한 타일의 색이 바뀝니다.
- 내 최고 기록과 현재 기록을 비교할 수 있습니다.
- 게임 상황에 맞는 사운드가 재생됩니다.

### 3. 핵심 로직을 커스텀 훅으로 추상화. 재사용성을 높여 반복되는 코드를 제거.

<img src="./src/assets/hooks.png">

- 전역상태인 `현재 플레이 상태`와 `현재 레벨`은 거의 모든 컴포넌트에 영향을 줍니다.
- 그러므로 각기 다른 컴포넌트에 모두 전역 상태를 불러오는 코드를 반복해서 쓰기보단 커스텀 훅으로 정리하여 로직 추상화를 진행하였습니다.

### 4. React.Memo를 통해 generateTileMap 함수가 여러 번 실행되는 것을 방지

- React.Memo를 써서 레벨이 바뀌는 경우에만 맵 생성 함수를 호출하고, 그 외엔 이전값을 계속 유지하게 설정하였습니다.
