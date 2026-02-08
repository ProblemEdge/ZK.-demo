import { useState, useEffect } from 'react';
import type { RankingUser, RankingType, Period, Mode } from '../_types';

/**
 * ランキングデータを管理するカスタムフック
 */
export const useRanking = (
  mainTab: string,
  rankingType: RankingType,
  period: Period,
  mode: Mode,
) => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingPage, setRankingPage] = useState(1);
  const [hasMoreRanking, setHasMoreRanking] = useState(true);

  const fetchRanking = async (reset: boolean = false) => {
    if (rankingLoading || (!reset && !hasMoreRanking)) return;

    try {
      setRankingLoading(true);
      const limit = 10;
      const currentPage = reset ? 1 : rankingPage;

      const res = await fetch(
        `/api/rankings?type=${rankingType}&period=${period}&mode=${mode}&page=${currentPage}&limit=${limit}`,
        { cache: 'no-store' },
      );

      if (!res.ok) throw new Error('ランキングの取得に失敗しました');

      const data = await res.json();

      if (reset) {
        setRanking(() => data.ranking);
        // ページ1を読み込んだので次は2ページ目から
        setRankingPage(2);
      } else {
        setRanking((prev) => [...prev, ...data.ranking]);
        setRankingPage(currentPage + 1);
      }

      // 取得件数が limit 未満ならもう追加読み込みは不要
      setHasMoreRanking(data.ranking.length === limit);
    } catch (err) {
      console.error('Ranking error:', err);
      setRanking([]);
      setHasMoreRanking(false);
    } finally {
      setRankingLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'ranking') {
      setRankingPage(1);
      setHasMoreRanking(true);
      setRankingLoading(false);
      fetchRanking(true);
    }
  }, [rankingType, period, mode, mainTab]);

  return {
    ranking,
    rankingLoading,
    hasMoreRanking,
    fetchRanking,
    setRankingLoading,
  };
};
