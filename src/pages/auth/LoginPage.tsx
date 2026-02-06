import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

export function LoginPage() {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    clearError();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      navigate('/'); // Redirection vers Unity
    } catch {
      setLocalError(error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fr-container fr-mt-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-6">
          <h1>Connexion</h1>
          <p className="fr-text--lead">
            Accédez à la Maison des Mathématiques Virtuelle
          </p>

          {(localError || error) && (
            <div className="fr-alert fr-alert--error fr-mb-3w">
              <p className="fr-alert__title">Erreur</p>
              <p>{localError || error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Adresse électronique"
              nativeInputProps={{
                type: "email",
                name: "email",
                required: true,
                disabled: loading,
                autoComplete: "email",
              }}
            />

            <Input
              label="Mot de passe"
              nativeInputProps={{
                type: "password",
                name: "password",
                required: true,
                disabled: loading,
                autoComplete: "current-password",
              }}
            />

            <p className="fr-mt-2w">
              <Link to="/forgot-password" className="fr-link">
                Mot de passe oublié ?
              </Link>
            </p>

            <Button 
              type="submit" 
              className="fr-mt-3w" 
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}