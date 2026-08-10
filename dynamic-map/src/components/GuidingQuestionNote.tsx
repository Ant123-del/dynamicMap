interface GuidingQuestionNoteProps {
  question: string
}

export function GuidingQuestionNote({ question }: GuidingQuestionNoteProps) {
  return (
    <div className="w-full max-w-md -rotate-1 rounded-lg border border-amber-300/50 bg-amber-200 p-5 text-slate-900 shadow-lg shadow-black/30">
      <p className="mb-1 text-[10px] font-semibold tracking-wide text-amber-800/70 uppercase">
        Guiding question
      </p>
      <p className="text-sm leading-snug font-medium whitespace-pre-wrap">{question}</p>
    </div>
  )
}
