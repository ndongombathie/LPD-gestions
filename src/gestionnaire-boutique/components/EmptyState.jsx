import React from 'react';

export default function EmptyState({ message = 'Aucune donnée trouvée.' }) {
  return (
    <div className="text-center text-gray-400 py-6 italic">
      {message}
    </div>
  );
}
