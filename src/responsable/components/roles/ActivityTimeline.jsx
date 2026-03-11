import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  ExternalLink,
} from "lucide-react";

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "réussi":
    case "succès":
    case "validé":
      return CheckCircle;
    case "échoué":
    case "refusé":
    case "annulé":
      return XCircle;
    case "en attente":
    case "en cours":
      return Clock;
    default:
      return AlertCircle;
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "réussi":
    case "succès":
    case "validé":
      return "text-emerald-600 bg-emerald-50 border-emerald-100";
    case "échoué":
    case "refusé":
    case "annulé":
      return "text-red-600 bg-red-50 border-red-100";
    case "en attente":
    case "en cours":
      return "text-amber-600 bg-amber-50 border-amber-100";
    default:
      return "text-gray-600 bg-gray-50 border-gray-100";
  }
};

export default function ActivityTimeline({ 
  activities = [], 
  title = "Activités récentes",
  maxItems = 10,
  onItemClick,
}) {
  const recentActivities = activities.slice(0, maxItems);
  
  if (recentActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Aucune activité récente
        </h3>
        <p className="text-gray-500">
          Aucune activité n'a été enregistrée récemment.
        </p>
      </div>
    );
  }

  // Grouper par date
  const activitiesByDate = recentActivities.reduce((acc, activity) => {
    const date = new Date(activity.date).toLocaleDateString("fr-FR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {recentActivities.length} activité{recentActivities.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-8">
          {Object.entries(activitiesByDate).map(([date, dayActivities]) => (
            <div key={date} className="relative">
              {/* Date header */}
              <div className="sticky top-0 z-10 bg-white py-2 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  <Calendar className="w-3 h-3" />
                  {date}
                </div>
              </div>

              {/* Activités du jour */}
              <div className="space-y-4 ml-12">
                {dayActivities.map((activity, index) => {
                  const StatusIcon = getStatusIcon(activity.status);
                  const statusColor = getStatusColor(activity.status);
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      {/* Point sur la timeline */}
                      <div className={`absolute -left-12 top-5 w-4 h-4 rounded-full border-4 border-white ${statusColor.split(' ')[1]}`} />

                      {/* Carte activité */}
                      <div
                        onClick={() => onItemClick?.(activity)}
                        className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group-hover:border-gray-300 ${
                          onItemClick ? "hover:scale-[1.02]" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded-md ${statusColor}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm font-medium text-gray-800">
                                {activity.description}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(activity.date)}
                              </span>
                              
                              {activity.type && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                                  {activity.type.replace(/_/g, ' ')}
                                </span>
                              )}
                              
                              {activity.reference && (
                                <span className="text-gray-600">
                                  Ref: {activity.reference}
                                </span>
                              )}
                              
                              {activity.module && (
                                <span className="text-indigo-600">
                                  {activity.module}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {onItemClick && (
                            <button className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Informations supplémentaires */}
                        {(activity.montant || activity.details) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              {activity.montant && (
                                <span className="text-sm font-semibold text-emerald-600">
                                  {new Intl.NumberFormat("fr-FR", {
                                    style: "currency",
                                    currency: "XOF",
                                  }).format(activity.montant)}
                                </span>
                              )}
                              
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                                {activity.status?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {activities.length > maxItems && (
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-700">
            Voir plus d'activités ({activities.length - maxItems} supplémentaires)
          </button>
        </div>
      )}
    </div>
  );
}