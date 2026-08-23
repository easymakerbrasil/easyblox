import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';

const UploadWorkspace = ({
    code,
    error
}) => {
    const [serialMonitorExpanded, setSerialMonitorExpanded] = useState(false);

    const handleSerialMonitorToggle = useCallback(() => {
        setSerialMonitorExpanded(expanded => !expanded);
    }, []);

    return (
        <div>
            <div>
                {error ? (
                    <p role="alert">
                        {error}
                    </p>
                ) : (
                    <textarea
                        aria-label="Código C++ gerado"
                        readOnly
                        spellCheck={false}
                        value={code}
                    />
                )}
            </div>

            <div>
                <button
                    aria-expanded={serialMonitorExpanded}
                    type="button"
                    onClick={handleSerialMonitorToggle}
                >
                    Monitor Serial
                </button>

                {serialMonitorExpanded ? (
                    <div
                        aria-label="Monitor Serial"
                        role="region"
                    />
                ) : null}
            </div>
        </div>
    );
};

UploadWorkspace.propTypes = {
    code: PropTypes.string.isRequired,
    error: PropTypes.string
};

UploadWorkspace.defaultProps = {
    error: null
};

export default UploadWorkspace;
