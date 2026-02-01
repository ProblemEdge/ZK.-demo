import PostStatusTag from "./PostStatusTag";
import QuestTag from "./QuestTag";

export default function TagSamplePreview() {
  return (
    <div className="flex flex-col gap-4 p-8 bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4">
        <span className="text-white">投票受付中:</span>
        <PostStatusTag status="voting" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">承認済み:</span>
        <PostStatusTag status="approved" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">拒否された:</span>
        <PostStatusTag status="rejected" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white">クエストタグ:</span>
        <QuestTag>松本市の秘境</QuestTag>
      </div>
    </div>
  );
}
