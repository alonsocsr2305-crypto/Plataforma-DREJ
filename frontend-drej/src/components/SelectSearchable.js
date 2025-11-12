import React, { useState, useEffect, useRef } from 'react';
import '../Css/select-searchable.css';

const SelectSearchable = ({ 
    options = [], 
    value = '', 
    onChange, 
    placeholder ='Buscar...', 
    name 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);

    // Filtrar opciones según búsqueda
    useEffect(() => {
        if (!options || options.length === 0) {
            setFilteredOptions([]);
            return;
        }

        const filtered = options.filter(option => {
            if (!option || typeof option !== 'string') {
                return false;
            }
            return option.toLowerCase().includes(searchTerm.toLowerCase());
        });
        setFilteredOptions(filtered);
    }, [searchTerm, options]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange({ target: { name, value: option } });
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="select-searchable" ref={wrapperRef}>
            <input
                type="text"
                className="select-input"
                placeholder={value || placeholder}
                value={isOpen ? searchTerm : (value || '')}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />
            <div className="select-arrow" onClick={() => setIsOpen(!isOpen)}>
                ▼
            </div>

            {isOpen && (
                <div className="select-dropdown">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                className="select-option"
                                onClick={() => handleSelect(option)}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div className="select-option disabled">
                            {searchTerm ? 'No se encontraron resultados' : 'Cargando instituciones...'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SelectSearchable;
