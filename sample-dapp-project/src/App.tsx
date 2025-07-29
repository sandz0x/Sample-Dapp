import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  X, 
  Code, 
  Eye, 
  Send, 
  Calculator,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import contract interface
import contractInterface from '../sample-contract/exec_interface.json';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [octraSDK, setOctraSDK] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodParams, setMethodParams] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const { toast } = useToast();

  // Initialize Octra SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Check if OctraSDK is available
        if (window.OctraSDK) {
          const sdk = new window.OctraSDK();
          setOctraSDK(sdk);
          
          // Check if already connected
          const isAvailable = await sdk.isAvailable();
          if (isAvailable && sdk.isWalletConnected()) {
            setIsConnected(true);
            setConnectedAddress(sdk.getConnectedAddress());
          }
        } else {
          console.warn('Octra SDK not found. Please install the Octra wallet extension.');
        }
      } catch (error) {
        console.error('Failed to initialize Octra SDK:', error);
      }
    };

    initSDK();
  }, []);

  const connectWallet = async () => {
    if (!octraSDK) {
      toast({
        title: "SDK Not Available",
        description: "Please install the Octra wallet extension",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await octraSDK.connect({
        appName: 'OCS01-TEST',
        appIcon: '/logo.png',
        permissions: ['view_address', 'sign_transactions']
      });

      if (result.success) {
        setIsConnected(true);
        setConnectedAddress(result.address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${result.address.slice(0, 8)}...${result.address.slice(-6)}`,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    if (octraSDK) {
      try {
        await octraSDK.disconnect();
        setIsConnected(false);
        setConnectedAddress('');
        setSelectedMethod(null);
        setMethodParams({});
        setLastResult(null);
        toast({
          title: "Wallet Disconnected",
          description: "Successfully disconnected from wallet",
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    // Initialize parameters
    const initialParams = {};
    method.params.forEach(param => {
      initialParams[param.name] = param.example || '';
    });
    setMethodParams(initialParams);
    setLastResult(null);
  };

  const handleParamChange = (paramName, value) => {
    setMethodParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const executeMethod = async () => {
    if (!selectedMethod || !octraSDK) return;

    setIsLoading(true);
    try {
      // Convert parameters to the format expected by the SDK
      const params = selectedMethod.params.map(param => ({
        name: param.name,
        type: param.type,
        value: methodParams[param.name] || '',
        example: param.example
      }));

      let result;
      if (selectedMethod.type === 'view') {
        result = await octraSDK.viewCall({
          contractAddress: contractInterface.contract,
          methodName: selectedMethod.name,
          params: params,
          description: selectedMethod.label
        });
      } else {
        result = await octraSDK.callContract({
          contractAddress: contractInterface.contract,
          methodName: selectedMethod.name,
          params: params,
          description: selectedMethod.label,
          gasLimit: 100000,
          gasPrice: 0.001
        });
      }

      setLastResult(result);
      toast({
        title: "Method Executed",
        description: `${selectedMethod.name} executed successfully`,
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="octra-sample-dapp-theme">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Code className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">OCS01-TEST</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    {truncateAddress(connectedAddress)}
                  </Badge>
                  <Button variant="outline" onClick={disconnectWallet}>
                    <X className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
              ) : (
                <Button onClick={connectWallet} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                  )}
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {!isConnected ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your Octra wallet to interact with the sample contract
              </p>
              <Button onClick={connectWallet} disabled={isLoading} size="lg">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contract Methods */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Contract Methods
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Contract: {truncateAddress(contractInterface.contract)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contractInterface.methods.map((method, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedMethod?.name === method.name
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                        onClick={() => handleMethodSelect(method)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{method.name}</h4>
                          <Badge variant={method.type === 'view' ? 'secondary' : 'default'}>
                            {method.type === 'view' ? (
                              <><Eye className="h-3 w-3 mr-1" />View</>
                            ) : (
                              <><Send className="h-3 w-3 mr-1" />Call</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{method.label}</p>
                        {method.params.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Parameters: {method.params.map(p => p.name).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Method Execution */}
              <div className="space-y-6">
                {selectedMethod ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Execute: {selectedMethod.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedMethod.label}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Parameters */}
                      {selectedMethod.params.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Parameters</h4>
                          {selectedMethod.params.map((param, index) => (
                            <div key={index} className="space-y-2">
                              <Label htmlFor={param.name}>
                                {param.name} ({param.type})
                              </Label>
                              <Input
                                id={param.name}
                                type={param.type === 'number' ? 'number' : 'text'}
                                value={methodParams[param.name] || ''}
                                onChange={(e) => handleParamChange(param.name, e.target.value)}
                                placeholder={param.example || `Enter ${param.name}`}
                                max={param.max}
                              />
                              {param.max && (
                                <p className="text-xs text-muted-foreground">
                                  Maximum value: {param.max}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Execute Button */}
                      <Button 
                        onClick={executeMethod} 
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : selectedMethod.type === 'view' ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {isLoading ? 'Executing...' : `Execute ${selectedMethod.type === 'view' ? 'View' : 'Call'}`}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a Method</h3>
                      <p className="text-muted-foreground">
                        Choose a contract method from the list to execute
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Results */}
                {lastResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Execution Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {lastResult.type === 'view' ? (
                        <div className="space-y-2">
                          <Label>Result:</Label>
                          <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(lastResult.result, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Transaction Hash:</Label>
                          <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                            {lastResult.txHash}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* SDK Info */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                SDK Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a sample DApp demonstrating contract interaction with the Octra wallet extension.
                  Make sure you have the Octra wallet extension installed and configured.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </main>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;