# Generates the extension's PNG icons into icons/. Run once: pwsh tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'icons'
New-Item -ItemType Directory -Force $out | Out-Null

$green = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#16a34a'))
$format = [System.Drawing.StringFormat]::new()
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center

foreach ($size in 16, 32, 48, 128) {
  $bmp = [System.Drawing.Bitmap]::new($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

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

  $font = [System.Drawing.Font]::new('Segoe UI', [single]($size * 0.62), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString('D', $font, [System.Drawing.Brushes]::White, [System.Drawing.RectangleF]::new(0, 0, $size, $size), $format)

  $file = Join-Path $out "icon$size.png"
  $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $font.Dispose(); $path.Dispose(); $g.Dispose(); $bmp.Dispose()
  Write-Host "Wrote $file"
}
