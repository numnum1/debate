import { LogOutIcon, MessagesSquareIcon, UserIcon } from 'lucide-react'
import { useAuth } from 'react-oidc-context'
import { Link } from 'react-router'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { displayName, register, signIn } from '@/auth'
import { formatPoints, initials } from '@/lib/format'
import { balance } from '@/mock/data'

/** Oben rechts: Anmelden/Registrieren, oder angemeldet Punktestand und Nutzermenü. */
export function AccountControls() {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center gap-2" data-testid="account-controls">
        <Button variant="ghost" onClick={() => void signIn(auth)} disabled={auth.isLoading} data-testid="account-sign-in-button">
          Anmelden
        </Button>
        <Button onClick={() => void register(auth)} disabled={auth.isLoading} data-testid="account-register-button">
          Registrieren
        </Button>
      </div>
    )
  }

  const name = displayName(auth)
  return (
    <div className="flex items-center gap-3" data-testid="account-controls">
      <span className="text-sm text-muted-foreground tabular-nums" data-testid="account-balance">{formatPoints(balance)}</span>
      <Button asChild data-testid="account-my-debates-link">
        <Link to="/home">
          <MessagesSquareIcon />
          Meine Debatten
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full" data-testid="account-menu-trigger">
          <Avatar>
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profil" data-testid="account-menu-profile">
              <UserIcon />
              Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void auth.signoutRedirect()} data-testid="account-menu-sign-out">
            <LogOutIcon />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
