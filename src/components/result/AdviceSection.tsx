type AdviceSectionProps = {
  readonly advice: string;
};

export default function AdviceSection({ advice }: AdviceSectionProps) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-foreground">AIからのアドバイス</h3>
      <blockquote className="relative rounded-xl border border-poker-gold/20 bg-poker-gold/5 p-5 pl-7">
        {/* アクセントバー */}
        <div className="absolute top-4 bottom-4 left-0 w-1 rounded-r-full bg-poker-gold" />
        <p className="whitespace-pre-wrap leading-relaxed text-foreground/80 italic">
          {advice}
        </p>
      </blockquote>
    </div>
  );
}
