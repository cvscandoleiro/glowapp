Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c """ & WshShell.CurrentDirectory & "\Portal Gestao e Planejamento.cmd""", 0, False
