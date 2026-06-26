import { Button } from "@/components/ui/button"

export function OverleafButton({ latexCode }: { latexCode: string }) {
  return (
    <form action="https://www.overleaf.com/docs" method="POST" target="_blank">
      <input type="hidden" name="snip" value={latexCode} />
      <Button type="submit" variant="primary">
        Open in Overleaf
      </Button>
    </form>
  )
}
