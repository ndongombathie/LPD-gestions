import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, Printer, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function ExportButton({
  data = [],
  fileName = "export",
  role = "",
  onExport,
}) {
  const [showOptions, setShowOptions] = useState(false);

  const exportOptions = [
    {
      id: "pdf",
      label: "PDF",
      icon: FileText,
      description: "Format imprimable",
      action: () => handleExport("pdf"),
    },
    {
      id: "excel",
      label: "Excel",
      icon: FileSpreadsheet,
      description: "Format tableur",
      action: () => handleExport("excel"),
    },
    {
      id: "print",
      label: "Imprimer",
      icon: Printer,
      description: "Version imprimable",
      action: () => handlePrint(),
    },
  ];

  const handleExport = (format) => {
    setShowOptions(false);
    
    toast.loading(`Génération ${format.toUpperCase()} en cours...`);
    
    // Simulation d'export
    setTimeout(() => {
      toast.success(`Export ${format.toUpperCase()} réussi !`);
      
      // Appel callback si fourni
      if (onExport) {
        onExport({ format, data, fileName: `${fileName}_${new Date().toISOString().split('T')[0]}` });
      }
    }, 1500);
  };

  const handlePrint = () => {
    setShowOptions(false);
    
    toast.loading("Préparation de l'impression...");
    
    setTimeout(() => {
      window.print();
      toast.success("Prêt pour l'impression");
    }, 1000);
  };

  const handleQuickExport = () => {
    handleExport("pdf");
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Bouton principal */}
        <button
          onClick={handleQuickExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>
        
        {/* Menu déroulant */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="inline-flex items-center px-3 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Options d'export */}
      {showOptions && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                Options d'export
              </div>
              
              {exportOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={option.action}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  >
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-gray-100 p-3">
              <div className="text-xs text-gray-500">
                {data.length} élément{data.length > 1 ? 's' : ''} à exporter
                {role && ` • Rôle: ${role}`}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}