import VoteStatusLabel from "./VoteStatusLabel";

export default function VoteStatusLabelSample() {
  return (
    <div className="flex flex-col gap-4 p-8 bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4">
        <span className="text-white">投票前（?）:</span>
        <VoteStatusLabel type="question" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">アルティメット:</span>
        <VoteStatusLabel type="ultimate" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">パーフェクト:</span>
        <VoteStatusLabel type="perfect" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">通常（成功率）:</span>
        <VoteStatusLabel type="success" approvedCount={7} rejectedCount={3} />
      </div>
    </div>
  );
}
