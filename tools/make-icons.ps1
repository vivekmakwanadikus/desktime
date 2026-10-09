# Generates the extension's PNG icons into icons/. Run once: pwsh tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'icons'
New-Item -ItemType Directory -Force $out | Out-Null

$green = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#16a34a'))
$round = [System.Drawing.Drawing2D.LineCap]::Round

foreach ($size in 16, 32, 48, 128) {
  $bmp = [System.Drawing.Bitmap]::new($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  # Rounded square background
  $d = [single]($size * 0.56)
  $far = [single]($size - $d)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($far, 0, $d, $d, 270, 90)
  $path.AddArc($far, $far, $d, $d, 0, 90)
  $path.AddArc(0, $far, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath($green, $path)

  # Progress ring: faint full track, solid arc covering three quarters from 12 o'clock
  $c = [single]($size / 2)
  $r = [single]($size * 0.27)
  $box = [System.Drawing.RectangleF]::new($c - $r, $c - $r, 2 * $r, 2 * $r)
  $track = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(90, 255, 255, 255), [single]($size * 0.095))
  $arc = [System.Drawing.Pen]::new([System.Drawing.Color]::White, [single]($size * 0.095))
  $arc.StartCap = $round; $arc.EndCap = $round
  $g.DrawEllipse($track, $box)
  $g.DrawArc($arc, $box, -90, 270)

  # Clock hands only where there are enough pixels to keep them crisp
  if ($size -ge 32) {
    $hand = [System.Drawing.Pen]::new([System.Drawing.Color]::White, [single]($size * 0.07))
    $hand.StartCap = $round; $hand.EndCap = $round
    $hand.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($hand, [System.Drawing.PointF[]]@(
      [System.Drawing.PointF]::new($c, $c - [single]($size * 0.14)),
      [System.Drawing.PointF]::new($c, $c),
      [System.Drawing.PointF]::new($c + [single]($size * 0.1), $c)))
    $hand.Dispose()
  }

  $file = Join-Path $out "icon$size.png"
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $track.Dispose(); $arc.Dispose(); $path.Dispose(); $g.Dispose(); $bmp.Dispose()
  Write-Host "Wrote $file"
}
