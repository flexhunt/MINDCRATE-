import { Suspense } from "react"
import InstructionsClient from "./instructions-client"

export default function InstructionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const url = searchParams.url as string
  const coins = searchParams.coins ? Number.parseInt(searchParams.coins as string) : 20
  const title = searchParams.title as string

  return (
    <div className="container mx-auto py-10">
      <Suspense fallback={<div>Loading...</div>}>
        <InstructionsClient url={url} coins={coins} title={title} />
      </Suspense>
    </div>
  )
}
