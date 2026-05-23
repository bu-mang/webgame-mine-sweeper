import { RootState } from "../store/index";
import { useDispatch, useSelector } from "react-redux";
import { setGoalAmountTiles } from "@/store/goalAmountSlice";
import { useEffect } from "react";
import { TileType } from "@/types/tile";
import usePlayingSwitch from "./usePlayingSwitch";
import useMineLeft from "./useMineLeft";
const useCountTileMap = (tileMapArr?: TileType[][]) => {
  const { playingSwitchHandler, currentPlayingState } = usePlayingSwitch();
  // 목표 타일 갯수 전역 관리
  const dispatchGoalAmount = useDispatch();
  const currentGoalAmount = useSelector((state: RootState) => {
    return state.goalAmount.value;
  });
  const { mineLeftHandler } = useMineLeft();

  // 목표 타일 갯수 설정 핸들러
  const setGoalToSucceed = (mines: number, X: number, Y: number) => {
    dispatchGoalAmount(setGoalAmountTiles(X * Y - mines));
  };

  // 열린 타일 체크, 목표와 타일이 같을 시
  useEffect(() => {
    if (!tileMapArr) return;
    if (currentPlayingState !== "playing") return;
    let openedAmount = 0;
    let flaggedAmount = 0;
    tileMapArr.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isOpened) {
          openedAmount++;
        }
        if (cell.isFlagged) {
          flaggedAmount++;
        }
      });
    });

    if (openedAmount === currentGoalAmount) {
      playingSwitchHandler("success");
    }
    mineLeftHandler(flaggedAmount);

    // eslint-disable-next-line
  }, [tileMapArr]);

  return { currentGoalAmount, setGoalToSucceed };
};

export default useCountTileMap;
