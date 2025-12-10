import Spinner from './Spinner';

const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
