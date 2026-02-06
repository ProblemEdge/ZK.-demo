import FeedCard from "../components/FeedCard";
import TagSamplePreview from "../components/TagSamplePreview";
import VoteStatusLabelSample from "../components/VoteStatusLabelSample";
import PostStatusTag from "../components/PostStatusTag";
import RangeTag from "../components/RangeTag";
import QuestTag from "../components/QuestTag";
import SimpleTag from "../components/SimpleTag";
import CommentButton from "../components/CommentButton";
import LikeButton from "../components/LikeButton";

export default function TagSamplePage() {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">タグ・ラベル サンプル</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">VoteStatusLabel</h2>
        <VoteStatusLabelSample />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">PostStatusTag</h2>
        <div className="flex flex-wrap gap-2">
          <PostStatusTag status="voting" />
          <PostStatusTag status="approved" />
          <PostStatusTag status="rejected" />
          <RangeTag scope="friend" />
          <RangeTag scope="global" />
          <SimpleTag label="松本城" />
          <CommentButton count={23} />
          <LikeButton count={15} />
          <LikeButton count={15} initialLiked/>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">QuestTag</h2>
        <div className="flex flex-wrap gap-2">
          <QuestTag>デイリークエスト</QuestTag>
          <QuestTag>アルティメットクエスト</QuestTag>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">その他タグサンプル</h2>
        <TagSamplePreview />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">FeedCard サンプル</h2>
        <FeedCard
          imageUrl="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=320&q=80"
          userName="nova"
          userId="kurubusicGG"
          tags={["松本市の秘境", "城下町"]}
          voteCount={7}
          likeCount={15}
          commentCount={23}
        >
          いつ面でいすて みーいきました！やっぱみんなで行くの最高＞＜すぎて泣き
        </FeedCard>
      </section>
    </div>
  );
}
