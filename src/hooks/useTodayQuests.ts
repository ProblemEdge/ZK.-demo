import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

export function useTodayQuests() {
  const { data, error, mutate, isLoading } = useSWR('/api/quests/today', fetcher, {
    revalidateOnFocus: false,
  });
  return { quests: data?.quests ?? [], error, mutate, isLoading };
}
