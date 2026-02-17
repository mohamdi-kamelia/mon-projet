import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

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
      navigate('/');
    } catch {
      setLocalError(error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header avec logo MAM */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Maison des Mathématiques Virtuelle
          </h1>
          <p className="text-lg text-gray-600">
            Explorez l'univers des mathématiques en 3D
          </p>
        </div>

        {/* Card DSFR */}
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Connexion
            </h2>
            <p className="text-blue-100 mt-1">
              Accédez à votre espace virtuel
            </p>
          </div>

          {/* Contenu de la card */}
          <div className="px-8 py-6">
            {/* Alert d'erreur DSFR */}
            {(localError || error) && (
              <div className="mb-6">
                <Alert
                  severity="error"
                  title="Erreur de connexion"
                  description={localError || error}
                  closable
                  onClose={() => {
                    setLocalError('');
                    clearError();
                  }}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input DSFR */}
              <Input
                label="Adresse électronique"
                hintText="Format : nom@exemple.fr"
                nativeInputProps={{
                  type: "email",
                  name: "email",
                  required: true,
                  disabled: loading,
                  autoComplete: "email",
                  placeholder: "nom@exemple.fr"
                }}
              />

              {/* Password Input DSFR */}
              <Input
                label="Mot de passe"
                nativeInputProps={{
                  type: "password",
                  name: "password",
                  required: true,
                  disabled: loading,
                  autoComplete: "current-password",
                  placeholder: "Entrez votre mot de passe"
                }}
              />

              {/* Lien mot de passe oublié */}
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="fr-link text-sm inline-flex items-center gap-1 hover:underline"
                >
                  Mot de passe oublié ?
                  <span className="ri-arrow-right-line" aria-hidden="true"></span>
                </Link>
              </div>

              {/* Submit Button DSFR */}
              <Button 
                type="submit"
                disabled={loading}
                iconId={loading ? undefined : "ri-login-box-line"}
                iconPosition="right"
                size="large"
                className="w-full"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>
          </div>

          {/* Footer de la card */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Première visite ?{' '}
              <span className="font-semibold text-blue-700">
                Contactez votre administrateur
              </span>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2026 Maison des Mathématiques Virtuelle
          </p>
        </div>
      </div>

      <style>{`
        /* Animations subtiles */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .bg-white {
          animation: fadeIn 0.5s ease-out;
        }

        /* Amélioration des inputs DSFR */
        .fr-input:focus {
          box-shadow: 0 0 0 2px rgba(0, 0, 145, 0.2);
        }

        /* Amélioration du bouton DSFR */
        .fr-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 145, 0.2);
        }

        .fr-btn {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}